using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SindicatoMinibusesAPI.Data;
using SindicatoMinibusesAPI.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configurar conexión a SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configurar CORS para permitir que cualquier cliente web o frontend consuma la API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configurar JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ClaveSecretaSuperSeguraParaElExamen2026";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SindicatoMinibusesAPI",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "SindicatoMinibusesClient",
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
        };
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Configuración estándar de Swagger limpia y sin errores

var app = builder.Build();

// Inicializar la base de datos y crear los usuarios iniciales con BCrypt real
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();

        if (!context.Usuarios.Any())
        {
            context.Usuarios.AddRange(
                new Usuario
                {
                    nombre_usuario_js = "Honorato Ticona",
                    password_hash_js = BCrypt.Net.BCrypt.HashPassword("secretario123"),
                    rol_js = "Secretario",
                    nombre_js = "Don Honorato Ticona"
                },
                new Usuario
                {
                    nombre_usuario_js = "Irma Calle",
                    password_hash_js = BCrypt.Net.BCrypt.HashPassword("controlador123"),
                    rol_js = "Controlador",
                    nombre_js = "Doña Irma Calle"
                }
            );
            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocurrió un error al crear la base de datos o los usuarios.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// NOTA: HttpsRedirection desactivado en desarrollo para permitir HTTP desde Live Server y Cloudflare
// app.UseHttpsRedirection();

// IMPORTANTE: CORS debe ir ANTES de autenticación
app.UseCors("AllowAll");

// IMPORTANTE: Habilitar archivos estáticos para leer la carpeta wwwroot
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();