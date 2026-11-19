using Microsoft.EntityFrameworkCore;
using SindicatoMinibusesAPI.Models;

namespace SindicatoMinibusesAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Afiliado> Afiliados { get; set; }
        public DbSet<Vehiculo> Vehiculos { get; set; }
        public DbSet<HojaRuta> HojasRuta { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Datos de prueba iniciales obligatorios por el examen
            modelBuilder.Entity<Usuario>().HasData(
                new Usuario { id_usuario_js = 1, nombre_usuario_js = "Honorato Ticona", password_hash_js = BCrypt.Net.BCrypt.HashPassword("secretario123"), rol_js = "Secretario", nombre_js = "Honorato Ticona" },
                new Usuario { id_usuario_js = 2, nombre_usuario_js = "Irma Calle", password_hash_js = BCrypt.Net.BCrypt.HashPassword("controlador123"), rol_js = "Controlador", nombre_js = "Irma Calle" }
            );
        }
    }
}