using System.ComponentModel.DataAnnotations;

namespace SindicatoMinibusesAPI.Models
{
    public class Usuario
    {
        [Key]
        public int id_usuario_js { get; set; }
        public string nombre_usuario_js { get; set; } = string.Empty;
        public string password_hash_js { get; set; } = string.Empty;
        public string rol_js { get; set; } = string.Empty; // "Secretario" o "Controlador"
        public string nombre_js { get; set; } = string.Empty;
    }
}