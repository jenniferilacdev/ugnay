namespace Ugnay.Domain.Officials;

/// <summary>Status of a single term of service. Ended terms are preserved as
/// history — administrations are never overwritten (spec §36).</summary>
public enum TermStatus
{
    Active = 1,
    Ended = 2,
}
