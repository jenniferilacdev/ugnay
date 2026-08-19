namespace Ugnay.Application.Common.Interfaces;

/// <summary>
/// Generates safe, gapless-per-year human-readable reference numbers such as
/// "RES-2026-000001" (spec §41). Implementations must be concurrency-safe.
/// </summary>
public interface IReferenceNumberGenerator
{
    Task<string> NextAsync(Guid tenantId, string prefix, CancellationToken cancellationToken = default);
}
