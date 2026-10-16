using Decoartes3D.Application.DTOs.Materials;
using Decoartes3D.Domain.Common;

namespace Decoartes3D.Application.Interfaces;

public interface IMaterialService
{
    Task<IEnumerable<MaterialResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<MaterialResponse>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<Result<MaterialResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<MaterialResponse>> CreateAsync(CreateMaterialRequest request, CancellationToken cancellationToken = default);
    Task<Result<MaterialResponse>> UpdateAsync(int id, CreateMaterialRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
