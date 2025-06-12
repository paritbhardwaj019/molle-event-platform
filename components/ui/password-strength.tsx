interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (password: string) => {
    let strength = 0;
    const requirements = [
      { regex: /.{8,}/, message: "At least 8 characters" },
      { regex: /[A-Z]/, message: "At least one uppercase letter" },
      { regex: /[a-z]/, message: "At least one lowercase letter" },
      { regex: /[0-9]/, message: "At least one number" },
      {
        regex: /[@$!%*?&]/,
        message: "At least one special character (@$!%*?&)",
      },
    ];

    const passedRequirements = requirements.filter((req) =>
      req.regex.test(password)
    );
    strength = passedRequirements.length;

    return {
      score: strength,
      passedRequirements,
      totalRequirements: requirements,
    };
  };

  const { score, passedRequirements, totalRequirements } =
    getStrength(password);
  const width = `${(score / totalRequirements.length) * 100}%`;

  const getColor = () => {
    if (score <= 2) return "bg-red-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getMessage = () => {
    if (score <= 2) return "Weak";
    if (score <= 3) return "Fair";
    if (score <= 4) return "Good";
    return "Strong";
  };

  if (!password) return null;

  return (
    <div className="mt-1 space-y-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width }}
        />
      </div>
      <p className={`text-xs ${getColor().replace("bg-", "text-")}`}>
        Password Strength - {getMessage()}
      </p>
      <ul className="text-xs space-y-1 text-gray-400">
        {totalRequirements.map((req, index) => (
          <li key={index} className="flex items-center">
            <span
              className={
                passedRequirements.includes(req)
                  ? "text-green-500"
                  : "text-gray-400"
              }
            >
              {passedRequirements.includes(req) ? "✓" : "○"} {req.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
