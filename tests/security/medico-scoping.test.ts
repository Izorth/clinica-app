import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Corre solo lectura contra la DB real (misma que no-password-leak.test.ts).
// A diferencia de ese archivo, la sesión mockeada cambia de rol/usuario entre
// tests, así que getServerSession queda como vi.fn() dinámico en vez de un
// mockResolvedValue fijo.
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { GET as getMedico, PATCH as patchMedico, DELETE as deleteMedico } from "@/app/api/medicos/[id]/route";
import { GET as getPaciente } from "@/app/api/pacientes/[id]/route";
import { GET as getPacientes } from "@/app/api/pacientes/route";
import { GET as getHora, PATCH as patchHora } from "@/app/api/horas/[id]/route";
import { GET as getHoras } from "@/app/api/horas/route";
import { GET as getStats } from "@/app/api/dashboard/stats/route";

// Fixtures resueltas a mano contra la DB real (ver inspección read-only):
// dos médicos reales con horas propias, y un paciente que A atendió pero B no.
const MEDICO_A = { id: "cmouxgg1s0003rz95hxejwihb", usuarioId: "cmouxgfj20001rz95ton3c827" };
const MEDICO_B = { id: "cmouxgh340006rz95k0qc4116", usuarioId: "cmouxggki0004rz953dn9omba" };
const PACIENTE_SOLO_A = "cmsnofv2i000jrztrefry92fs";

function mockSesion(rol: "ADMIN" | "MEDICO" | "RECEPCIONISTA", userId: string) {
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: userId, rol } } as never);
}
function mockSinSesion() {
  vi.mocked(getServerSession).mockResolvedValue(null as never);
}

afterEach(() => {
  vi.mocked(getServerSession).mockReset();
});

describe("scoping por MEDICO en la API (solo lectura, DB real, sesión mockeada)", () => {
  let horaDeA: string;

  beforeAll(async () => {
    const hora = await prisma.hora.findFirst({ where: { medicoId: MEDICO_A.id }, select: { id: true } });
    if (!hora) {
      throw new Error(
        "No hay horas para el médico fixture — el seed cambió, hay que re-resolver MEDICO_A/MEDICO_B/PACIENTE_SOLO_A."
      );
    }
    horaDeA = hora.id;
  });

  describe("GET /api/pacientes/[id]", () => {
    it("MEDICO B no puede ver un paciente que nunca atendió: 404, no 403", async () => {
      mockSesion("MEDICO", MEDICO_B.usuarioId);
      const res = await getPaciente(new Request("http://localhost/api/pacientes/x"), {
        params: Promise.resolve({ id: PACIENTE_SOLO_A }),
      });
      expect(res.status).toBe(404);
    });

    it("MEDICO A sí puede ver a su propio paciente", async () => {
      mockSesion("MEDICO", MEDICO_A.usuarioId);
      const res = await getPaciente(new Request("http://localhost/api/pacientes/x"), {
        params: Promise.resolve({ id: PACIENTE_SOLO_A }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(PACIENTE_SOLO_A);
    });

    it("ADMIN y RECEPCIONISTA ven cualquier paciente", async () => {
      mockSesion("ADMIN", "test-admin");
      const resAdmin = await getPaciente(new Request("http://localhost/api/pacientes/x"), {
        params: Promise.resolve({ id: PACIENTE_SOLO_A }),
      });
      expect(resAdmin.status).toBe(200);

      mockSesion("RECEPCIONISTA", "test-recepcionista");
      const resRecepcionista = await getPaciente(new Request("http://localhost/api/pacientes/x"), {
        params: Promise.resolve({ id: PACIENTE_SOLO_A }),
      });
      expect(resRecepcionista.status).toBe(200);
    });
  });

  describe("GET /api/pacientes (lista)", () => {
    it("MEDICO B no ve en su lista al paciente exclusivo de A", async () => {
      mockSesion("MEDICO", MEDICO_B.usuarioId);
      const res = await getPacientes(new NextRequest("http://localhost/api/pacientes"));
      const body = await res.json();
      expect(body.some((p: { id: string }) => p.id === PACIENTE_SOLO_A)).toBe(false);
    });

    it("MEDICO A sí ve en su lista a su paciente", async () => {
      mockSesion("MEDICO", MEDICO_A.usuarioId);
      const res = await getPacientes(new NextRequest("http://localhost/api/pacientes"));
      const body = await res.json();
      expect(body.some((p: { id: string }) => p.id === PACIENTE_SOLO_A)).toBe(true);
    });
  });

  describe("GET /api/horas/[id]", () => {
    it("MEDICO B no puede ver una hora de MEDICO A: 404", async () => {
      mockSesion("MEDICO", MEDICO_B.usuarioId);
      const res = await getHora(new NextRequest("http://localhost/api/horas/x"), {
        params: Promise.resolve({ id: horaDeA }),
      });
      expect(res.status).toBe(404);
    });

    it("MEDICO A sí puede ver su propia hora", async () => {
      mockSesion("MEDICO", MEDICO_A.usuarioId);
      const res = await getHora(new NextRequest("http://localhost/api/horas/x"), {
        params: Promise.resolve({ id: horaDeA }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /api/horas/[id] (solo los caminos que NO escriben en prod)", () => {
    it("MEDICO B no puede PATCHear una hora de MEDICO A: 404 antes de tocar la DB", async () => {
      mockSesion("MEDICO", MEDICO_B.usuarioId);
      const req = new NextRequest("http://localhost/api/horas/x", { method: "PATCH", body: JSON.stringify({}) });
      const res = await patchHora(req, { params: Promise.resolve({ id: horaDeA }) });
      expect(res.status).toBe(404);
    });

    it("MEDICO A no puede reasignar medicoId/pacienteId de su propia hora: 403 antes del update", async () => {
      mockSesion("MEDICO", MEDICO_A.usuarioId);
      const req = new NextRequest("http://localhost/api/horas/x", {
        method: "PATCH",
        body: JSON.stringify({ medicoId: MEDICO_B.id }),
      });
      const res = await patchHora(req, { params: Promise.resolve({ id: horaDeA }) });
      expect(res.status).toBe(403);
    });

    it("ADMIN reasignando a un medicoId inexistente: 400 claro, nunca llega al update", async () => {
      mockSesion("ADMIN", "test-admin");
      const req = new NextRequest("http://localhost/api/horas/x", {
        method: "PATCH",
        body: JSON.stringify({ medicoId: "medico-que-no-existe" }),
      });
      const res = await patchHora(req, { params: Promise.resolve({ id: horaDeA }) });
      expect(res.status).toBe(400);
    });

    // El camino feliz (MEDICO actualizando su propia hora, o ADMIN reasignando)
    // sí ejecuta prisma.hora.update contra la DB real de producción — igual
    // que POST /api/medicos en no-password-leak.test.ts, no hay DB de
    // desarrollo separada para ejercitarlo sin ensuciar datos reales.
    it.todo(
      "MEDICO actualizando su propia hora debe devolver 200 — pendiente: requiere DB de desarrollo separada"
    );
  });

  describe("GET /api/horas (lista)", () => {
    it("MEDICO B pidiendo ?medicoId=A se ignora: solo recibe lo suyo", async () => {
      mockSesion("MEDICO", MEDICO_B.usuarioId);
      const res = await getHoras(new NextRequest(`http://localhost/api/horas?medicoId=${MEDICO_A.id}`));
      const body = await res.json();
      expect(body.length).toBeGreaterThan(0);
      expect(body.every((h: { medicoId: string }) => h.medicoId === MEDICO_B.id)).toBe(true);
      expect(body.some((h: { id: string }) => h.id === horaDeA)).toBe(false);
    });
  });

  describe("GET/PATCH/DELETE /api/medicos/[id]", () => {
    it("MEDICO B ve el directorio de A pero sin su agenda (horas: [])", async () => {
      mockSesion("MEDICO", MEDICO_B.usuarioId);
      const res = await getMedico(new NextRequest("http://localhost/api/medicos/x"), {
        params: Promise.resolve({ id: MEDICO_A.id }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.horas).toEqual([]);
    });

    it("MEDICO A viendo su propio registro sí trae su agenda", async () => {
      mockSesion("MEDICO", MEDICO_A.usuarioId);
      const res = await getMedico(new NextRequest("http://localhost/api/medicos/x"), {
        params: Promise.resolve({ id: MEDICO_A.id }),
      });
      const body = await res.json();
      expect(body.horas.length).toBeGreaterThan(0);
    });

    it("ADMIN/RECEPCIONISTA sí ven la agenda de cualquier médico", async () => {
      mockSesion("RECEPCIONISTA", "test-recepcionista");
      const res = await getMedico(new NextRequest("http://localhost/api/medicos/x"), {
        params: Promise.resolve({ id: MEDICO_A.id }),
      });
      const body = await res.json();
      expect(body.horas.length).toBeGreaterThan(0);
    });

    it("MEDICO no puede PATCHear a otro médico: 403 antes de tocar la DB", async () => {
      mockSesion("MEDICO", MEDICO_B.usuarioId);
      const req = new NextRequest("http://localhost/api/medicos/x", { method: "PATCH", body: JSON.stringify({}) });
      const res = await patchMedico(req, { params: Promise.resolve({ id: MEDICO_A.id }) });
      expect(res.status).toBe(403);
    });

    it("RECEPCIONISTA no puede eliminar un médico: 403, nunca llega a prisma.medico.delete", async () => {
      mockSesion("RECEPCIONISTA", "test-recepcionista");
      const res = await deleteMedico(new NextRequest("http://localhost/api/medicos/x"), {
        params: Promise.resolve({ id: MEDICO_A.id }),
      });
      expect(res.status).toBe(403);
    });

    it("un MEDICO tampoco puede eliminarse a sí mismo: 403", async () => {
      mockSesion("MEDICO", MEDICO_A.usuarioId);
      const res = await deleteMedico(new NextRequest("http://localhost/api/medicos/x"), {
        params: Promise.resolve({ id: MEDICO_A.id }),
      });
      expect(res.status).toBe(403);
    });

    it.todo(
      "ADMIN editando su propio registro / borrando un médico sin horas debe funcionar — pendiente: requiere DB de desarrollo separada"
    );
  });

  describe("GET /api/dashboard/stats", () => {
    it("un MEDICO nunca ve más pacientes/horas-hoy que un ADMIN (está acotado, no global)", async () => {
      mockSesion("MEDICO", MEDICO_A.usuarioId);
      const resMedico = await getStats(new NextRequest("http://localhost/api/dashboard/stats"));
      const medico = await resMedico.json();

      mockSesion("ADMIN", "test-admin");
      const resAdmin = await getStats(new NextRequest("http://localhost/api/dashboard/stats"));
      const admin = await resAdmin.json();

      expect(medico.totalPacientes).toBeLessThan(admin.totalPacientes);
      expect(medico.horasPendientes).toBeLessThan(admin.horasPendientes);
    });
  });

  describe("Usuario MEDICO sin fila Medico asociada (medicoId null)", () => {
    const USUARIO_HUERFANO = "usuario-medico-sin-fila-medico-asociada";

    it("nunca degrada a 've todo': listas vacías y stats en cero", async () => {
      mockSesion("MEDICO", USUARIO_HUERFANO);
      expect(await (await getHoras(new NextRequest("http://localhost/api/horas"))).json()).toEqual([]);

      mockSesion("MEDICO", USUARIO_HUERFANO);
      expect(await (await getPacientes(new NextRequest("http://localhost/api/pacientes"))).json()).toEqual([]);

      mockSesion("MEDICO", USUARIO_HUERFANO);
      const stats = await (await getStats(new NextRequest("http://localhost/api/dashboard/stats"))).json();
      expect(stats.totalPacientes).toBe(0);
      expect(stats.agendaHoy).toEqual([]);
    });
  });

  describe("sin sesión", () => {
    it("401 en lista de horas (y por extensión, en cualquier ruta detrás de requireActor)", async () => {
      mockSinSesion();
      const res = await getHoras(new NextRequest("http://localhost/api/horas"));
      expect(res.status).toBe(401);
    });
  });
});
