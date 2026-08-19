using Microsoft.Extensions.DependencyInjection;

namespace Ugnay.Application;

/// <summary>
/// Application-layer service registration. Empty in Phase 0 — use cases,
/// validators (FluentValidation) and handlers are added from Phase 3 onward.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Phase 3+: register use-case handlers, validators, mappers here.
        return services;
    }
}
