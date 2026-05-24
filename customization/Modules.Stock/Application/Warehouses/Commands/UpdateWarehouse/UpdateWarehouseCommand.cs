using System;
using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Commands.UpdateWarehouse;

public record UpdateWarehouseCommand(
    Guid Id,
    string Name,
    string Code,
    string? Street,
    string? City,
    string? Wilaya,
    string? PostalCode,
    string? ResponsiblePerson,
    string? Description
) : IRequest<Result<WarehouseDto>>;
