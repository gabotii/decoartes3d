using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Decoartes3D.API.Middleware;

public class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    IHostEnvironment environment,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, title, detail) = exception switch
        {
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "Conflicto de concurrencia",
                "Los datos han cambiado mientras se procesaba la solicitud (p. ej. el stock). Vuelve a intentarlo."),
            DbUpdateException => (StatusCodes.Status409Conflict, "No se pudo guardar",
                "La operación entra en conflicto con datos existentes."),
            BadHttpRequestException badRequest => (badRequest.StatusCode, "Solicitud no válida", badRequest.Message),
            OperationCanceledException => (499, "Solicitud cancelada", "El cliente canceló la solicitud."),
            _ => (StatusCodes.Status500InternalServerError, "Error interno del servidor",
                "Se ha producido un error inesperado.")
        };

        if (status >= 500)
            logger.LogError(exception, "Excepción no controlada en {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
        else
            logger.LogWarning(exception, "Excepción controlada ({Status}) en {Method} {Path}", status, httpContext.Request.Method, httpContext.Request.Path);

        httpContext.Response.StatusCode = status;

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            // En desarrollo se expone el mensaje real para depurar; en producción nunca.
            Detail = environment.IsDevelopment() && status >= 500 ? exception.ToString() : detail
        };

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception
        });
    }
}
