using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SindicatoMinibusesAPI.Models
{
    public class Aporte
    {
        [Key]
        public int id_aporte_js { get; set; }
        public decimal monto_js { get; set; } = 10.00m;
        public DateTime fecha_aporte_js { get; set; } = DateTime.Now.Date;
        public string estado_js { get; set; } = "Pendiente";

        public int id_vehiculo_js { get; set; }
        [ForeignKey("id_vehiculo_js")]
        public Vehiculo? vehiculo_js { get; set; }
    }
}