using Decoartes3D.Infrastructure;
using Decoartes3D.Infrastructure.Data;
using Decoartes3D.Infrastructure.Data.Seed;
using Microsoft.EntityFrameworkCore;

namespace Decoartes3D.API.Configuration;

public static class DatabaseInitializer
{
    /// <summary>
    /// Aplica migraciones pendientes y ejecuta el seeder. Se activa con Database:MigrateOnStartup
    /// (pensado para desarrollo y Docker; en producción es preferible migrar desde el pipeline de despliegue).
    /// </summary>
    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        if (!app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
            return;

        using var scope = app.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        try
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            if (DependencyInjection.UsesSqlite(app.Configuration))
                await context.Database.EnsureCreatedAsync();
            else
                await context.Database.MigrateAsync();
            await scope.ServiceProvider.GetRequiredService<DataSeeder>().SeedAsync();
            logger.LogInformation("Base de datos lista.");
        }
        catch (Exception ex)
        {
            // La API arranca igualmente (Swagger, health check) para facilitar el diagnóstico.
            logger.LogCritical(ex, "No se pudo inicializar la base de datos. Revisa ConnectionStrings:DefaultConnection.");
        }
    }
}
