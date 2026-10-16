using Decoartes3D.Application.DTOs.Materials;
using Decoartes3D.Application.Interfaces;
using Decoartes3D.Application.Mappings;
using Decoartes3D.Domain.Common;
using Decoartes3D.Domain.Entities;
using Decoartes3D.Domain.Interfaces;
using Decoartes3D.Domain.Interfaces.Repositories;

namespace Decoartes3D.Application.Services;

public class MaterialService(
    IMaterialRepository materialRepository,
    IProductRepository productRepository,
    IUnitOfWork unitOfWork) : IMaterialService
{
    private const string NotFoundMessage = "Material no encontrado.";

    public async Task<IEnumerable<MaterialResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var materials = await materialRepository.GetAllAsync(cancellationToken);
        return materials.OrderBy(m => m.Name).Select(m => m.ToResponse()).ToList();
    }

    public async Task<IEnumerable<MaterialResponse>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        var materials = await materialRepository.GetActiveAsync(cancellationToken);
        return materials.Select(m => m.ToResponse()).ToList();
    }

    public async Task<Result<MaterialResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var material = await materialRepository.GetByIdAsync(id, cancellationToken);
        return material is null
            ? Result.NotFound<MaterialResponse>(NotFoundMessage)
            : Result.Success(material.ToResponse());
    }

    public async Task<Result<MaterialResponse>> CreateAsync(CreateMaterialRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        if (await NameExistsAsync(name, null, cancellationToken))
            return Result.Conflict<MaterialResponse>($"Ya existe un material llamado '{name}'.");

        var material = new Material
        {
            Name = name,
            Description = request.Description?.Trim(),
            ColorHex = NormalizeColor(request.ColorHex),
            IsActive = request.IsActive
        };

        await materialRepository.AddAsync(material, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(material.ToResponse());
    }

    public async Task<Result<MaterialResponse>> UpdateAsync(int id, CreateMaterialRequest request, CancellationToken cancellationToken = default)
    {
        var material = await materialRepository.GetByIdAsync(id, cancellationToken);
        if (material is null)
            return Result.NotFound<MaterialResponse>(NotFoundMessage);

        var name = request.Name.Trim();
        if (await NameExistsAsync(name, id, cancellationToken))
            return Result.Conflict<MaterialResponse>($"Ya existe un material llamado '{name}'.");

        material.Name = name;
        material.Description = request.Description?.Trim();
        material.ColorHex = NormalizeColor(request.ColorHex);
        material.IsActive = request.IsActive;

        await materialRepository.UpdateAsync(material, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(material.ToResponse());
    }

    public async Task<Result> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var material = await materialRepository.GetByIdAsync(id, cancellationToken);
        if (material is null)
            return Result.NotFound(NotFoundMessage);

        if (await productRepository.ExistsAsync(p => p.MaterialId == id, cancellationToken))
            return Result.Conflict("No se puede eliminar un material usado por productos. Desactívalo en su lugar.");

        await materialRepository.DeleteAsync(material, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private Task<bool> NameExistsAsync(string name, int? excludeId, CancellationToken cancellationToken) =>
        materialRepository.ExistsAsync(m => m.Name == name && (excludeId == null || m.Id != excludeId), cancellationToken);

    private static string? NormalizeColor(string? colorHex) =>
        string.IsNullOrWhiteSpace(colorHex) ? null : colorHex.Trim().ToUpperInvariant();
}
