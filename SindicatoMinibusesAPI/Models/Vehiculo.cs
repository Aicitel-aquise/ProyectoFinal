using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SindicatoMinibusesAPI.Models
{
    public class Vehiculo
    {
        [Key]
        public int id_vehiculo_js { get; set; }
        public string placa_js { get; set; } = string.Empty;
        public string linea_js { get; set; } = string.Empty;

        public int id_afiliado_js { get; set; }
        [ForeignKey("id_afiliado_js")]
        public Afiliado? Afiliado { get; set; }
        public ICollection<HojaRuta>? HojasRuta { get; set; }
    }
}