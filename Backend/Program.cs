using System.Text.Json.Serialization;
using Npgsql;
using Dapper;
using BCrypt.Net;

var builder = WebApplication.CreateBuilder(args);

var connectionString = "Host=localhost;Database=postgres;Username=postgres;Password=";

await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();

await using var command = new NpgsqlCommand("SELECT 1", connection);
var result = await command.ExecuteScalarAsync();

Console.WriteLine($"Postgres bağlantısı test sonucu: {result}");

var roleNames = await connection.QueryAsync<string>("SELECT name FROM roles");
foreach (var name in roleNames)
{
    Console.WriteLine($"Rol: {name}");
}

await connection.ExecuteAsync(
    "INSERT INTO roles (name) VALUES (@Name)",
    new { Name = "Test Rol" }
);

var hash = BCrypt.Net.BCrypt.HashPassword("reynaz");
Console.WriteLine(hash);

var isCorrect = BCrypt.Net.BCrypt.Verify("reynaz", hash);
Console.WriteLine($"Şifre doğru mu: {isCorrect}");

var isWrong = BCrypt.Net.BCrypt.Verify("yanlis_sifre", hash);
Console.WriteLine($"Yanlış şifre doğru mu: {isWrong}");




builder.Services.AddCors();

builder.Services.AddHttpClient("ml", c => c.BaseAddress = new Uri("http://127.0.0.1:8000"));

builder.Services.AddSingleton<IPartRepository, CsvPartRepository>();

var app = builder.Build();

app.MapGet("/", () => "MRO Project Home Page");

app.MapGet("/api/parts", (IPartRepository repo) => repo.GetAllParts());

app.MapGet("/api/parts/{id}", (string id, IPartRepository repo) =>
{
    var part = repo.GetById(id);
    return part is null ? Results.NotFound() : Results.Ok(part);
});

app.MapGet("/api/orders/{id}", (IPartRepository repo, string id) =>
{
    var order = repo.GetSupplierInfo(id);
    return order is null ? Results.NotFound() : Results.Ok(order);
});

app.MapGet("/api/parts/{id}/prediction", async (string id, IPartRepository repo, IHttpClientFactory f) =>
{
    var part = repo.GetById(id);
    if (part is null) return Results.NotFound();

    var ml = f.CreateClient("ml");

    var answer = await ml.PostAsJsonAsync("/predict/stock", new
    {
        category = part.Category,
        criticality = part.Criticality,
        stock_quantity = part.StockQuantity,
        avg_daily_usage = part.AvgDailyUsage,
        usage_trend_pct = part.UsageTrendPct
    });
    var stock = await answer.Content.ReadFromJsonAsync<StockEstimation>();

    return Results.Ok(stock);
});

app.MapGet("/api/orders/{id}/prediction", async (string id, IPartRepository repo, IHttpClientFactory f) =>
{
    var part = repo.GetSupplierInfo(id);
    if (part is null) return Results.NotFound();

    var ml = f.CreateClient("ml");

    var answer = await ml.PostAsJsonAsync("/predict/leadtime", new
    {
        category = part.Category,
        criticality = part.Criticality,
        supplier_name = part.SupplierName,
        supplier_country = part.SupplierCountry,
        shipping_method = part.ShippingMethod,
        supplier_reliability_score = part.SupplierReliabilityScore,
        promised_delivery_days = part.PromisedDeliveryDays
    });
    var leadTime = await answer.Content.ReadFromJsonAsync<LeadTimeEstimation>();

    return Results.Ok(leadTime);
});

app.MapPost("/api/login", async (LoginRequest request) =>
{
    await using var connection = new NpgsqlConnection(connectionString);

    var user = await connection.QuerySingleOrDefaultAsync<UserRecord>(
        "SELECT id, username, password_hash AS PasswordHash, full_name AS FullName, role_id AS RoleId FROM users WHERE username = @Username",
        new { Username = request.Username }
    );

    if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
    {
        return Results.Unauthorized();
    }

    var roleName = await connection.QuerySingleAsync<string>(
        "SELECT name FROM roles WHERE id = @RoleId",
        new { RoleId = user.RoleId }
    );

    return Results.Ok(new { user.Id, user.Username, user.FullName, Role = roleName });
});

app.MapPost("/api/orders", async (OrderRequest request) =>
{
    await using var connection = new NpgsqlConnection(connectionString);

    await connection.ExecuteAsync(
        "INSERT INTO orders (product_id, ordered_by, predicted_stockout_day, predicted_lead_time_days) VALUES (@ProductId, @OrderedBy, @PredictedStockoutDay, @PredictedLeadTimeDays)",
        new { request.ProductId, request.OrderedBy, request.PredictedStockoutDay, request.PredictedLeadTimeDays }
    );

    return Results.Ok(new { message = "Sipariş kaydedildi." });
});

app.MapPost("/api/register", async (RegisterRequest request) =>
{
    await using var connection = new NpgsqlConnection(connectionString);

    var existing = await connection.QuerySingleOrDefaultAsync<int?>(
        "SELECT id FROM users WHERE username = @Username",
        new { request.Username }
    );
    if (existing != null)
    {
        return Results.Conflict(new { message = "Bu kullanıcı adı zaten alınmış." });
    }

    var roleId = await connection.QuerySingleOrDefaultAsync<int?>(
        "SELECT id FROM roles WHERE name = @RoleName",
        new { request.RoleName }
    );
    if (roleId == null)
    {
        return Results.BadRequest(new { message = "Geçersiz rol." });
    }

    var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

    await connection.ExecuteAsync(
        "INSERT INTO users (username, password_hash, full_name, role_id) VALUES (@Username, @PasswordHash, @FullName, @RoleId)",
        new { request.Username, PasswordHash = passwordHash, request.FullName, RoleId = roleId }
    );

    return Results.Ok(new { message = "Kayıt başarılı." });
});

app.MapGet("/api/users", async () =>
{
    await using var connection = new NpgsqlConnection(connectionString);
    var users = await connection.QueryAsync<UserListItem>(
        @"SELECT u.id AS Id, u.username AS Username, u.full_name AS FullName, r.name AS RoleName
          FROM users u
          JOIN roles r ON u.role_id = r.id
          ORDER BY u.id"
    );
    return Results.Ok(users);
});

app.MapPut("/api/users/{id}/role", async (int id, ChangeRoleRequest request) =>
{
    await using var connection = new NpgsqlConnection(connectionString);

    var actingRole = await connection.QuerySingleOrDefaultAsync<string>(
        @"SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = @ActingUserId",
        new { request.ActingUserId }
    );
    if (actingRole != "Admin")
    {
        return Results.BadRequest(new { message = "Bu işlem için Admin yetkisi gerekiyor." });
    }

    var newRoleId = await connection.QuerySingleOrDefaultAsync<int?>(
        "SELECT id FROM roles WHERE name = @NewRoleName",
        new { request.NewRoleName }
    );
    if (newRoleId is null)
    {
        return Results.BadRequest(new { message = "Geçersiz rol." });
    }

    await connection.ExecuteAsync(
        "UPDATE users SET role_id = @NewRoleId WHERE id = @Id",
        new { NewRoleId = newRoleId, Id = id }
    );

    return Results.Ok(new { message = "Rol güncellendi." });
});

app.MapGet("/api/orders", async () =>
{
    await using var connection = new NpgsqlConnection(connectionString);
    var orders = await connection.QueryAsync<OrderHistoryItem>(
        @"SELECT o.id AS Id, o.product_id AS ProductId, u.full_name AS OrderedByName,
                 o.ordered_at AS OrderedAt, o.predicted_stockout_day AS PredictedStockoutDay,
                 o.predicted_lead_time_days AS PredictedLeadTimeDays
          FROM orders o
          JOIN users u ON o.ordered_by = u.id
          ORDER BY o.ordered_at DESC"
    );
    return Results.Ok(orders);
});

app.MapPost("/api/forgot-password", async (ChangePasswordRequest request) =>
{
    await using var connection = new NpgsqlConnection(connectionString);

    var user = await connection.QuerySingleOrDefaultAsync<UserRecord>(
        "SELECT id, username, password_hash AS PasswordHash, full_name AS FullName, role_id AS RoleId FROM users WHERE username = @Username",
        new { request.Username }
    );

    if (user is null || !BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
    {
        return Results.BadRequest(new { message = "Username or current password is incorrect." });
    }

    var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
    await connection.ExecuteAsync(
        "UPDATE users SET password_hash = @NewHash WHERE id = @Id",
        new { NewHash = newHash, Id = user.Id }
    );

    return Results.Ok(new { message = "Password updated successfully." });
});

app.UseCors(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

app.Run();

record Part(
    string ProductId,
    string ProductName,
    string Category,
    string Criticality,
    int StockQuantity,
    double AvgDailyUsage,
    double UsageTrendPct
);

record SupplierOrder(
    string ProductId,
    string ProductName,
    string Category,
    string Criticality,
    string SupplierName,
    string SupplierCountry,
    string ShippingMethod,
    double SupplierReliabilityScore,
    int PromisedDeliveryDays
);

record StockEstimation(
    [property: JsonPropertyName("median_day")] double MedianDay,
    [property: JsonPropertyName("earliest_day")] double EarliestDay,
    [property: JsonPropertyName("latest_day")] double LatestDay
);

record LeadTimeEstimation(
    [property: JsonPropertyName("lead_time")] double LeadTime,
    [property: JsonPropertyName("promised_delivery_days")] double PromisedDeliveryDays,
    [property: JsonPropertyName("delay_warning")] bool DelayWarning
);

record LoginRequest(
    string Username,
    string Password
);

class UserRecord
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string FullName { get; set; } = "";
    public int RoleId { get; set; }
}

record OrderRequest(
    string ProductId, 
    int OrderedBy, 
    double PredictedStockoutDay, 
    double PredictedLeadTimeDays
);

record RegisterRequest(
    string Username, 
    string Password, 
    string FullName, 
    string RoleName
);

class UserListItem
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string FullName { get; set; } = "";
    public string RoleName { get; set; } = "";
}

record ChangeRoleRequest(
    int ActingUserId, 
    string NewRoleName
);

class OrderHistoryItem
{
    public int Id { get; set; }
    public string ProductId { get; set; } = "";
    public string OrderedByName { get; set; } = "";
    public DateTime OrderedAt { get; set; }
    public double PredictedStockoutDay { get; set; }
    public double PredictedLeadTimeDays { get; set; }
}

record ChangePasswordRequest(
    string Username, 
    string OldPassword, 
    string NewPassword
);



interface IPartRepository
{
    List<Part> GetAllParts();

    List<SupplierOrder> GetAllOrders();
    Part? GetById(string id);
    SupplierOrder? GetSupplierInfo(string productId);
}

class CsvPartRepository : IPartRepository
{
    private readonly List<Part> _parts;

    private readonly List<SupplierOrder> _orders;

    public CsvPartRepository()
    {
        _parts = File.ReadAllLines("Data/model1_live_inventory.csv")
            .Skip(1)
            .Select(row => row.Split(','))
            .Select(k => new Part(
                k[0], k[1], k[2], k[3],
                int.Parse(k[4]),
                double.Parse(k[5], System.Globalization.CultureInfo.InvariantCulture),
                double.Parse(k[6], System.Globalization.CultureInfo.InvariantCulture)
            ))
            .ToList();

        _orders = File.ReadAllLines("Data/model2_live_suppliers.csv")
        .Skip(1)
        .Select(row => row.Split(','))
        .Select(k => new SupplierOrder(
            k[0], k[1], k[2], k[3], k[4], k[5], k[6],
            double.Parse(k[7], System.Globalization.CultureInfo.InvariantCulture),
            int.Parse(k[8])
        ))
        .ToList();
    }


    public List<Part> GetAllParts() => _parts;

    public List<SupplierOrder> GetAllOrders() => _orders;

    public Part? GetById(string id) => _parts.FirstOrDefault(p => p.ProductId == id);

    public SupplierOrder? GetSupplierInfo(string productId) =>
    _orders.Where(o => o.ProductId == productId)
           .OrderByDescending(o => o.SupplierReliabilityScore)
           .FirstOrDefault();

}