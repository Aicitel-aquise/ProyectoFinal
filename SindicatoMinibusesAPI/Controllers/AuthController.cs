using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SindicatoMinibusesAPI.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SindicatoMinibusesAPI.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO request)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.nombre_usuario_js == request.nombre_usuario_js);

            if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.password_js, usuario.password_hash_js))
            {
                return Unauthorized(new { mensaje = "Credenciales incorrectas. Verifique su usuario y contraseña." });
            }

            // Generar Token JWT
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "ClaveSecretaSuperSeguraParaElExamen2026");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, usuario.nombre_usuario_js),
                    new Claim(ClaimTypes.Role, usuario.rol_js),
                    new Claim("nombre_js", usuario.nombre_js)
                }),
                Expires = DateTime.UtcNow.AddHours(8),
                Issuer = _configuration["Jwt:Issuer"] ?? "SindicatoMinibusesAPI",
                Audience = _configuration["Jwt:Audience"] ?? "SindicatoMinibusesClient",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new
            {
                token_js = tokenString,
                rol_js = usuario.rol_js,
                nombre_js = usuario.nombre_js,
                mensaje = "Inicio de sesión exitoso"
            });
        }
    }

    public class LoginRequestDTO
    {
        public string nombre_usuario_js { get; set; } = string.Empty;
        public string password_js { get; set; } = string.Empty;
    }
}