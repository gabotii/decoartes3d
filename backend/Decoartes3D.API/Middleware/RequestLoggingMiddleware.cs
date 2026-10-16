using System.Diagnostics;

namespace Decoartes3D.API.Middleware;

public class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            stopwatch.Stop();
            var status = context.Response.StatusCode;
            var level = status >= 500 ? LogLevel.Error : status >= 400 ? LogLevel.Warning : LogLevel.Information;

            logger.Log(level, "{Method} {Path} → {StatusCode} en {ElapsedMs} ms",
                context.Request.Method,
                context.Request.Path,
                status,
                stopwatch.ElapsedMilliseconds);
        }
    }
}
