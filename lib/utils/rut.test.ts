import { describe, it, expect } from "vitest";
import { calcularDv, formatearRut, limpiarRut, validarRut } from "./rut";

describe("calcularDv", () => {
  it("calcula el dígito verificador numérico", () => {
    expect(calcularDv("12345678")).toBe("5");
    expect(calcularDv("9876543")).toBe("3");
    expect(calcularDv("16234567")).toBe("2");
  });

  it("devuelve K cuando el resto es 10", () => {
    expect(calcularDv("10000013")).toBe("K");
    expect(calcularDv("999999")).toBe("K");
  });

  it("devuelve 0 cuando el resto es 11", () => {
    expect(calcularDv("10000004")).toBe("0");
  });
});

describe("validarRut", () => {
  it("acepta un RUT correcto en cualquier formato", () => {
    expect(validarRut("12.345.678-5")).toBe(true);
    expect(validarRut("12345678-5")).toBe(true);
    expect(validarRut("123456785")).toBe(true);
    expect(validarRut(" 12.345.678 - 5 ")).toBe(true);
  });

  it("acepta dígito verificador K en mayúscula o minúscula", () => {
    expect(validarRut("10.000.013-K")).toBe(true);
    expect(validarRut("10.000.013-k")).toBe(true);
  });

  it("rechaza un dígito verificador incorrecto", () => {
    expect(validarRut("12.345.678-9")).toBe(false);
    expect(validarRut("19.345.678-3")).toBe(false);
    expect(validarRut("16.234.567-K")).toBe(false);
    expect(validarRut("12.222.222-K")).toBe(false); // el DV real es 5
  });

  it("rechaza basura y formatos imposibles", () => {
    expect(validarRut("")).toBe(false);
    expect(validarRut("asdasd")).toBe(false);
    expect(validarRut("12345")).toBe(false); // cuerpo muy corto
    expect(validarRut("123456789012-3")).toBe(false); // cuerpo muy largo
    expect(validarRut("1234567X")).toBe(false); // DV no numérico ni K
  });

  it("acepta RUTs antiguos de 6 dígitos y RUTs de empresa", () => {
    expect(validarRut("999.999-K")).toBe(true);
    expect(validarRut("76.086.428-5")).toBe(true);
  });

  it("acepta un RUT que parece basura pero tiene DV correcto", () => {
    // 123123123 = 12.312.312-3. Se ve tecleado al azar, pero el módulo 11
    // cuadra: la validación de DV no reemplaza a la verificación de identidad.
    expect(validarRut("123123123")).toBe(true);
  });
});

describe("formatearRut", () => {
  it("canoniza cualquier formato de entrada a la misma salida", () => {
    const canonico = "12.345.678-5";
    expect(formatearRut("123456785")).toBe(canonico);
    expect(formatearRut("12345678-5")).toBe(canonico);
    expect(formatearRut("12.345.678-5")).toBe(canonico);
  });

  it("normaliza la K a mayúscula", () => {
    expect(formatearRut("10000013k")).toBe("10.000.013-K");
  });

  it("no inserta puntos de más en cuerpos cortos", () => {
    expect(formatearRut("999999K")).toBe("999.999-K");
  });
});

describe("limpiarRut", () => {
  it("deja solo cuerpo y dígito verificador", () => {
    expect(limpiarRut("12.345.678-5")).toBe("123456785");
    expect(limpiarRut("10.000.013-k")).toBe("10000013K");
  });
});
