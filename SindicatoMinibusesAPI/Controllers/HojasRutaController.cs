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
    public class HojasRutaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HojasRutaController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/HojasRuta - Incluye datos del vehículo para el frontend
        [HttpGet]
        public async Task<IActionResult> GetHojasRuta()
        {
            var hojas = await _context.HojasRuta
                .Include(h => h.Vehiculo)
                .Select(h => new {
                    h.id_hoja_ruta_js,
                    h.id_vehiculo_js,
                    placa_js = h.Vehiculo != null ? h.Vehiculo.placa_js : "",
                    linea_js = h.Vehiculo != null ? h.Vehiculo.linea_js : "",
                    h.fecha_emision_js,
                    h.monto_js,
                    monto_aporte_js = h.monto_js,
                    h.aporte_pagado_js,
                    estado_pago_js = h.aporte_pagado_js ? "Pagado" : "Pendiente",
                    h.nombre_controlador_js
                })
                .OrderByDescending(h => h.fecha_emision_js)
                .ToListAsync();
            return Ok(hojas);
        }

        // POST: api/HojasRuta
        [HttpPost]
        public async Task<IActionResult> CrearHojaRuta([FromBody] HojaRuta nuevaHoja)
        {
            // Validamos que el vehículo exista antes de registrar la hoja de ruta
            var vehiculoExiste = await _context.Vehiculos.AnyAsync(v => v.id_vehiculo_js == nuevaHoja.id_vehiculo_js);
            if (!vehiculoExiste)
            {
                return BadRequest(new { mensaje = "El vehículo especificado no existe en el sistema." });
            }

            // Guardamos la hoja de ruta enviada por el cliente con los datos que trae
            _context.HojasRuta.Add(nuevaHoja);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Hoja de ruta emitida correctamente.",
                datos = nuevaHoja
            });
        }
    }
}