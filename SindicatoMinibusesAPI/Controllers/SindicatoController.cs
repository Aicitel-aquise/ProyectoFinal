using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SindicatoMinibusesAPI.Data;
using SindicatoMinibusesAPI.Models;

namespace SindicatoMinibusesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SindicatoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SindicatoController(AppDbContext context)
        {
            _context = context;
        }

        // ================= AFILIADOS (CRUD) =================
        [HttpGet("afiliados")]
        public async Task<IActionResult> ListarAfiliados() => Ok(await _context.Afiliados.ToListAsync());

        [HttpPost("afiliados")]
        [Authorize(Roles = "Secretario")]
        public async Task<IActionResult> CrearAfiliado([FromBody] Afiliado modelo)
        {
            _context.Afiliados.Add(modelo);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Afiliado registrado con éxito", afiliado = modelo });
        }

        [HttpPut("afiliados/{id}")]
        [Authorize(Roles = "Secretario")]
        public async Task<IActionResult> EditarAfiliado(int id, [FromBody] Afiliado modelo)
        {
            var af = await _context.Afiliados.FindAsync(id);
            if (af == null) return NotFound(new { mensaje = "Afiliado no encontrado" });

            af.nombre_js = modelo.nombre_js;
            af.celular_js = modelo.celular_js;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Afiliado actualizado" });
        }

        [HttpDelete("afiliados/{id}")]
        [Authorize(Roles = "Secretario")]
        public async Task<IActionResult> EliminarAfiliado(int id)
        {
            var af = await _context.Afiliados.FindAsync(id);
            if (af == null) return NotFound(new { mensaje = "Afiliado no encontrado" });

            _context.Afiliados.Remove(af);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Afiliado eliminado" });
        }

        // ================= VEHÍCULOS (CRUD) =================
        [HttpGet("vehiculos")]
        public async Task<IActionResult> ListarVehiculos()
        {
            var lista = await _context.Vehiculos
                .Include(v => v.Afiliado)
                .Select(v => new {
                    v.id_vehiculo_js,
                    v.placa_js,
                    v.linea_js,
                    v.id_afiliado_js,
                    nombre_afiliado_js = v.Afiliado != null ? v.Afiliado.nombre_js : "Sin asignar"
                }).ToListAsync();
            return Ok(lista);
        }

        [HttpPost("vehiculos")]
        [Authorize(Roles = "Secretario")]
        public async Task<IActionResult> CrearVehiculo([FromBody] Vehiculo modelo)
        {
            string placaNorm = modelo.placa_js.Trim().ToUpper();
            if (await _context.Vehiculos.AnyAsync(v => v.placa_js.ToUpper() == placaNorm))
                return BadRequest(new { mensaje = $"La placa {placaNorm} ya está registrada." });

            modelo.placa_js = placaNorm;
            _context.Vehiculos.Add(modelo);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Vehículo registrado con éxito" });
        }

        [HttpPut("vehiculos/{id}")]
        [Authorize(Roles = "Secretario")]
        public async Task<IActionResult> EditarVehiculo(int id, [FromBody] Vehiculo modelo)
        {
            var v = await _context.Vehiculos.FindAsync(id);
            if (v == null) return NotFound(new { mensaje = "Vehículo no encontrado" });

            v.placa_js = modelo.placa_js.Trim().ToUpper();
            v.linea_js = modelo.linea_js;
            v.id_afiliado_js = modelo.id_afiliado_js;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Vehículo actualizado" });
        }

        [HttpDelete("vehiculos/{id}")]
        [Authorize(Roles = "Secretario")]
        public async Task<IActionResult> EliminarVehiculo(int id)
        {
            var v = await _context.Vehiculos.FindAsync(id);
            if (v == null) return NotFound(new { mensaje = "Vehículo no encontrado" });

            _context.Vehiculos.Remove(v);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Vehículo eliminado" });
        }

        // ================= PROCESO CENTRAL =================
        [HttpPost("hojas-ruta")]
        public async Task<IActionResult> EmitirHojaRuta([FromBody] HojaRutaRequest req)
        {
            string placa = req.placa_js.Trim().ToUpper();
            var vehiculo = await _context.Vehiculos.FirstOrDefaultAsync(v => v.placa_js.ToUpper() == placa);
            if (vehiculo == null) return NotFound(new { mensaje = $"Vehículo con placa {placa} no existe." });

            // RN 1: Una sola hoja de ruta por día
            var hoy = DateTime.Today;
            if (await _context.HojasRuta.AnyAsync(h => h.id_vehiculo_js == vehiculo.id_vehiculo_js && h.fecha_emision_js.Date == hoy))
                return BadRequest(new { mensaje = $"Regla de negocio: El vehículo {placa} ya tiene su hoja de ruta emitida hoy." });

            // RN 2: Máximo 3 aportes pendientes (Bloquea si ya tiene 3 o más)
            int deudas = await _context.HojasRuta.CountAsync(h => h.id_vehiculo_js == vehiculo.id_vehiculo_js && !h.aporte_pagado_js);
            if (deudas >= 3)
                return BadRequest(new { mensaje = $"Regla de negocio BLOQUEADA: El vehículo tiene {deudas} aportes pendientes (máximo permitido: 3)." });

            var nueva = new HojaRuta
            {
                id_vehiculo_js = vehiculo.id_vehiculo_js,
                fecha_emision_js = DateTime.Now,
                monto_js = 10.00m,
                aporte_pagado_js = req.aporte_pagado_js
            };

            _context.HojasRuta.Add(nueva);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Hoja de ruta emitida correctamente.", hoja_ruta = new { nueva.id_hoja_ruta_js, placa_js = placa, nueva.fecha_emision_js, nueva.aporte_pagado_js } });
        }

        // ================= APORTES =================
        [HttpGet("aportes/pendientes")]
        public async Task<IActionResult> ListarAportesPendientes()
        {
            var p = await _context.HojasRuta
                .Include(h => h.Vehiculo)
                .Where(h => !h.aporte_pagado_js)
                .Select(h => new { h.id_hoja_ruta_js, placa_js = h.Vehiculo != null ? h.Vehiculo.placa_js : "", h.fecha_emision_js, h.monto_js })
                .ToListAsync();
            return Ok(p);
        }

        [HttpPut("aportes/pagar/{id}")]
        public async Task<IActionResult> PagarAporte(int id)
        {
            var h = await _context.HojasRuta.FindAsync(id);
            if (h == null) return NotFound();
            h.aporte_pagado_js = true;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Aporte marcado como cobrado." });
        }

        // ================= REPORTE =================
        [HttpGet("reportes/recaudacion")]
        [Authorize(Roles = "Secretario")]
        public async Task<IActionResult> Reporte()
        {
            var hoy = DateTime.Today;
            var hojasHoy = await _context.HojasRuta.Where(h => h.fecha_emision_js.Date == hoy).ToListAsync();

            var detalles = await _context.Afiliados.Select(a => new {
                nombre_afiliado_js = a.nombre_js,
                celular_js = a.celular_js,
                cantidad_vehiculos_js = a.Vehiculos.Count,
                total_aportado_js = a.Vehiculos.SelectMany(v => v.HojasRuta).Where(h => h.aporte_pagado_js).Sum(h => (decimal?)h.monto_js) ?? 0m,
                deuda_pendiente_js = a.Vehiculos.SelectMany(v => v.HojasRuta).Where(h => !h.aporte_pagado_js).Sum(h => (decimal?)h.monto_js) ?? 0m
            }).ToListAsync();

            return Ok(new
            {
                total_recaudado_js = hojasHoy.Where(h => h.aporte_pagado_js).Sum(h => h.monto_js),
                aportes_pendientes_js = await _context.HojasRuta.CountAsync(h => !h.aporte_pagado_js),
                hojas_emitidas_hoy_js = hojasHoy.Count,
                detalles_afiliados_js = detalles
            });
        }
    }

    public class HojaRutaRequest
    {
        public string placa_js { get; set; } = string.Empty;
        public bool aporte_pagado_js { get; set; }
    }
}