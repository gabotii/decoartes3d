using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Categories;
using Decoartes3D.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Decoartes3D.API.Controllers;

[Route("api/categories")]
public class CategoriesController(ICategoryService categoryService) : ApiControllerBase
{
    /// <summary>Categorías activas (catálogo público). ProductCount cuenta solo productos activos.</summary>
    [HttpGet]
    public async Task<IEnumerable<CategoryResponse>> GetActive(CancellationToken cancellationToken) =>
        await categoryService.GetActiveAsync(cancellationToken);

    /// <summary>Todas las categorías, incluidas las inactivas.</summary>
    [HttpGet("all")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IEnumerable<CategoryResponse>> GetAll(CancellationToken cancellationToken) =>
        await categoryService.GetAllAsync(cancellationToken);

    [HttpGet("{id:int}")]
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await categoryService.GetByIdAsync(id, cancellationToken);
        if (result.IsSuccess && !result.Value.IsActive && !IsAdmin)
            return NotFound();
        return FromResult(result);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CategoryResponse>> Create(CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var result = await categoryService.CreateAsync(request, cancellationToken);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value)
            : Failure(result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<CategoryResponse>> Update(int id, UpdateCategoryRequest request, CancellationToken cancellationToken) =>
        FromResult(await categoryService.UpdateAsync(id, request, cancellationToken));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken) =>
        FromResult(await categoryService.DeleteAsync(id, cancellationToken));
}
