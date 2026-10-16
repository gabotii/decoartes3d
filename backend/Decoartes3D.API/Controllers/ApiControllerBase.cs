using Decoartes3D.Application.Common;
using Decoartes3D.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace Decoartes3D.API.Controllers;

[ApiController]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    protected int? CurrentUserId =>
        int.TryParse(User.FindFirst(AppClaims.UserId)?.Value, out var id) ? id : null;

    protected bool IsAdmin => User.IsInRole(AppRoles.Admin);

    protected ActionResult<T> FromResult<T>(Result<T> result) =>
        result.IsSuccess ? Ok(result.Value) : Failure(result);

    protected IActionResult FromResult(Result result) =>
        result.IsSuccess ? NoContent() : Failure(result);

    protected ObjectResult Failure(Result result)
    {
        var (status, title) = result.ErrorType switch
        {
            ErrorType.NotFound => (StatusCodes.Status404NotFound, "Recurso no encontrado"),
            ErrorType.Conflict => (StatusCodes.Status409Conflict, "Conflicto"),
            ErrorType.Unauthorized => (StatusCodes.Status401Unauthorized, "No autorizado"),
            ErrorType.Forbidden => (StatusCodes.Status403Forbidden, "Acceso denegado"),
            _ => (StatusCodes.Status400BadRequest, "Solicitud no válida")
        };

        return Problem(detail: result.Error, statusCode: status, title: title);
    }
}
