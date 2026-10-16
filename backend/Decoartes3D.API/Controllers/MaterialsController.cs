using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Materials;
using Decoartes3D.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Decoartes3D.API.Controllers;

[Route("api/materials")]
public class MaterialsController(IMaterialService materialService) : ApiControllerBase
{
    /// <summary>Materiales activos (filtros del catálogo).</summary>
    [HttpGet]
    public async Task<IEnumerable<MaterialResponse>> GetActive(CancellationToken cancellationToken) =>
        await materialService.GetActiveAsync(cancellationToken);

    [HttpGet("all")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IEnumerable<MaterialResponse>> GetAll(CancellationToken cancellationToken) =>
        await materialService.GetAllAsync(cancellationToken);

    [HttpGet("{id:int}")]
    [ProducesResponseType<MaterialResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MaterialResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await materialService.GetByIdAsync(id, cancellationToken);
        if (result.IsSuccess && !result.Value.IsActive && !IsAdmin)
            return NotFound();
        return FromResult(result);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    [ProducesResponseType<MaterialResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MaterialResponse>> Create(CreateMaterialRequest request, CancellationToken cancellationToken)
    {
        var result = await materialService.CreateAsync(request, cancellationToken);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value)
            : Failure(result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<MaterialResponse>> Update(int id, CreateMaterialRequest request, CancellationToken cancellationToken) =>
        FromResult(await materialService.UpdateAsync(id, request, cancellationToken));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken) =>
        FromResult(await materialService.DeleteAsync(id, cancellationToken));
}
