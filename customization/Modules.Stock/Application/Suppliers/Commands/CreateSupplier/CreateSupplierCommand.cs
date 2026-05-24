using System;
using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.Suppliers.Commands.CreateSupplier;

public record CreateSupplierCommand(
    string Name,
    string? ContactPerson,
    string? Phone,
    string? Email,
    string? Street,
    string? City,
    string? Wilaya,
    string? PostalCode,
    string? Notes
) : IRequest<Result<SupplierDto>>;
