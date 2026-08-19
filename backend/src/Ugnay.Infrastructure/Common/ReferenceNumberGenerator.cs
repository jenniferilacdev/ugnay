using System.Data;
using Microsoft.EntityFrameworkCore;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Infrastructure.Persistence;

namespace Ugnay.Infrastructure.Common;

/// <summary>
/// Concurrency-safe reference numbers via an atomic upsert-and-increment on the
/// counter row (spec §41). The <c>INSERT … ON CONFLICT … DO UPDATE … RETURNING</c>
/// runs as a single statement, so concurrent callers never collide or reuse a value.
/// Executed over ADO.NET because EF's SqlQuery would wrap it in an (invalid) subquery.
/// </summary>
public class ReferenceNumberGenerator(AppDbContext db) : IReferenceNumberGenerator
{
    private const string UpsertSql =
        """
        INSERT INTO reference_counters (id, tenant_id, prefix, year, next_value)
        VALUES (gen_random_uuid(), @tenant, @prefix, @year, 1)
        ON CONFLICT (tenant_id, prefix, year)
        DO UPDATE SET next_value = reference_counters.next_value + 1
        RETURNING next_value;
        """;

    public async Task<string> NextAsync(
        Guid tenantId, string prefix, CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var connection = db.Database.GetDbConnection();

        await using var command = connection.CreateCommand();
        command.CommandText = UpsertSql;
        AddParameter(command, "tenant", tenantId);
        AddParameter(command, "prefix", prefix);
        AddParameter(command, "year", year);

        var opened = false;
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
            opened = true;
        }

        try
        {
            var result = await command.ExecuteScalarAsync(cancellationToken);
            var value = Convert.ToInt64(result);
            return $"{prefix}-{year}-{value:D6}";
        }
        finally
        {
            if (opened) await connection.CloseAsync();
        }
    }

    private static void AddParameter(System.Data.Common.DbCommand command, string name, object value)
    {
        var p = command.CreateParameter();
        p.ParameterName = name;
        p.Value = value;
        command.Parameters.Add(p);
    }
}
