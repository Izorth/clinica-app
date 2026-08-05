import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Corre solo lectura contra la DB real (misma que usa `npm run dev`/`npm run seed`).
// No inserta, actualiza ni borra nada — solo llama a handlers GET y revisa el body.
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "test-admin", rol: "ADMIN" },
  }),
}));

import { prisma } from "@/lib/prisma";
import { GET as getMedicos } from "@/app/api/medicos/route";
import { GET as getMedico } from "@/app/api/medicos/[id]/route";
import { GET as getPaciente } from "@/app/api/pacientes/[id]/route";
import { GET as getStats } from "@/app/api/dashboard/stats/route";
import { GET as getHoras } from "@/app/api/horas/route";

// Clave "password" en JSON, o un hash bcrypt ($2a$/$2b$/$2y$...) en cualquier parte del body.
const PASSWORD_LEAK_PATTERN = /"password"\s*:|\$2[aby]\$/;

function assertNoLeak(text: string) {
  expect(text).not.toMatch(PASSWORD_LEAK_PATTERN);
}

describe("no-password-leak (solo lectura, DB real, sesión ADMIN mockeada)", () => {
  let medicoId: string;
  let pacienteConHorasId: string;

  beforeAll(async () => {
    const medico = await prisma.medico.findFirst({ select: { id: true } });
    // Un paciente que sí tiene horas: así se ejercita paciente → horas → medico → usuario,
    // que es la cadena de includes que realmente puede arrastrar el password.
    const paciente = await prisma.paciente.findFirst({
      where: { horas: { some: {} } },
      select: { id: true },
    });
    if (!medico) {
      throw new Error(
        "No hay médicos en la DB apuntada por DATABASE_URL — corre `npm run seed` antes de este test."
      );
    }
    if (!paciente) {
      throw new Error(
        "No hay ningún paciente con horas en la DB apuntada por DATABASE_URL — corre `npm run seed` antes de este test."
      );
    }
    medicoId = medico.id;
    pacienteConHorasId = paciente.id;
  });

  it("GET /api/medicos: hay médicos reales y ninguno expone password", async () => {
    const res = await getMedicos();
    const text = await res.text();
    const body = JSON.parse(text) as Array<{
      id: string;
      especialidad: string;
      usuario: { nombre: string; email: string };
    }>;

    if (body.length === 0) {
      throw new Error(
        "GET /api/medicos devolvió una lista vacía — la base de pruebas no tiene médicos, corre `npm run seed`."
      );
    }
    expect(body[0].usuario.nombre).toEqual(expect.any(String));
    expect(body[0].usuario.email).toEqual(expect.any(String));
    expect(body[0].especialidad).toEqual(expect.any(String));

    assertNoLeak(text);
  });

  it("GET /api/medicos/[id]: trae el médico real y no expone password", async () => {
    const res = await getMedico(new NextRequest("http://localhost/api/medicos/x"), {
      params: Promise.resolve({ id: medicoId }),
    });
    const text = await res.text();
    const body = JSON.parse(text) as {
      id: string;
      usuario: { nombre: string; email: string };
    } | null;

    if (!body?.usuario?.nombre) {
      throw new Error(
        `GET /api/medicos/${medicoId} no devolvió un médico con usuario.nombre — revisa el seed o el id usado en el test.`
      );
    }

    assertNoLeak(text);
  });

  it("GET /api/pacientes/[id]: trae horas reales (medico.usuario incluido) y no expone password", async () => {
    const res = await getPaciente(new Request("http://localhost/api/pacientes/x"), {
      params: Promise.resolve({ id: pacienteConHorasId }),
    });
    const text = await res.text();
    const body = JSON.parse(text) as {
      id: string;
      horas: Array<{ medico: { usuario: { nombre: string } } }>;
    } | null;

    if (!body?.horas?.length) {
      throw new Error(
        `GET /api/pacientes/${pacienteConHorasId} devolvió 0 horas — se eligió este paciente justamente porque debía tener al menos una. Revisa el seed.`
      );
    }
    expect(body.horas[0].medico.usuario.nombre).toEqual(expect.any(String));

    assertNoLeak(text);
  });

  it("GET /api/dashboard/stats: agendaHoy trae horas reales (medico.usuario incluido) y no expone password", async () => {
    const res = await getStats(new NextRequest("http://localhost/api/dashboard/stats"));
    const text = await res.text();
    const body = JSON.parse(text) as {
      totalPacientes: number;
      agendaHoy: Array<{ medico: { usuario: { nombre: string } } }>;
    };

    if (body.totalPacientes === 0) {
      throw new Error("GET /api/dashboard/stats: totalPacientes es 0 — la base de pruebas parece vacía, corre `npm run seed`.");
    }
    if (body.agendaHoy.length === 0) {
      throw new Error(
        "GET /api/dashboard/stats: agendaHoy vino vacío — el seed genera horas para 'hoy', si esto falla puede que el seed esté desactualizado respecto a la fecha actual."
      );
    }
    expect(body.agendaHoy[0].medico.usuario.nombre).toEqual(expect.any(String));

    assertNoLeak(text);
  });

  // GET /api/horas usa horaInclude (lib/prisma/includes.ts) — la forma de include
  // COMPARTIDA entre app/api/horas/route.ts (GET/POST) y app/api/horas/[id]/route.ts
  // (GET/PATCH). Los cuatro puntos importan el mismo objeto `horaInclude`, sin
  // overrides por ruta, así que ejercitar uno de sus consumidores GET alcanza para
  // cubrir la forma compartida — no se duplica cubriendo también horas/[id].
  it("GET /api/horas: hay horas reales con horaInclude y ninguna expone password", async () => {
    const res = await getHoras(new NextRequest("http://localhost/api/horas"));
    const text = await res.text();
    const body = JSON.parse(text) as Array<{
      medico: { usuario: { nombre: string } };
      paciente: { nombre: string };
    }>;

    if (body.length === 0) {
      throw new Error(
        "GET /api/horas devolvió una lista vacía — la base de pruebas no tiene horas, corre `npm run seed`."
      );
    }
    expect(body[0].medico.usuario.nombre).toEqual(expect.any(String));
    expect(body[0].paciente.nombre).toEqual(expect.any(String));

    assertNoLeak(text);
  });

  // POST /api/medicos crea un Usuario+Medico real. DATABASE_URL hoy apunta al
  // único proyecto Supabase que existe (vhmekhnrlogwjudshjsy) — no hay entorno
  // de desarrollo separado, así que un test que escribe ensuciaría esos datos.
  // Reactivar apenas exista un proyecto Supabase de dev dedicado a tests.
  it.todo(
    "POST /api/medicos no debe devolver password en el body — pendiente: requiere un proyecto Supabase de desarrollo separado del actual"
  );
});
