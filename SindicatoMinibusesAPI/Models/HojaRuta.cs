using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SindicatoMinibusesAPI.Models
{
    public class HojaRuta
    {
        [Key]
        public int id_hoja_ruta_js { get; set; }

        public int id_vehiculo_js { get; set; }
        [ForeignKey("id_vehiculo_js")]
        public Vehiculo? Vehiculo { get; set; }

        public DateTime fecha_emision_js { get; set; } = DateTime.Now;

        // Tipo explícito para SQL Server: decimal(18,2) evita truncamiento silencioso
        [Column(TypeName = "decimal(18,2)")]
        public decimal monto_js { get; set; } = 10.00m;

        // true = Pagado | false = Pendiente
        public bool aporte_pagado_js { get; set; } = true;

        // Nombre del controlador que emitió la hoja (campo informativo)
        public string? nombre_controlador_js { get; set; }
    }
}