using System.ComponentModel.DataAnnotations;

namespace SindicatoMinibusesAPI.Models
{
    public class Afiliado
    {
        [Key]
        public int id_afiliado_js { get; set; }
        public string nombre_js { get; set; } = string.Empty;
        public string celular_js { get; set; } = string.Empty;
        public ICollection<Vehiculo>? Vehiculos { get; set; }
    }
}