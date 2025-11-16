"""Script to detect hardcoded strings that should use constants."""

import ast
from pathlib import Path
import re
import sys

# Directories to check
CHECK_DIRS = ["core", "routers", "services", "schemas", "models", "utils"]

# Directories to ignore
IGNORE_DIRS = ["__pycache__", ".git", "alembic", "tests", "scripts"]

# Files to ignore
IGNORE_FILES = ["__init__.py", "constants.py", "config.py"]

# Patterns that indicate hardcoded strings that should be constants
ERROR_MESSAGE_PATTERNS = [
    r'raise\s+\w+Exception\s*\([^)]*"[^"]+"',  # raise Exception("message")
    r"raise\s+\w+Exception\s*\([^)]*\'[^\']+\'",  # raise Exception('message')
    r'detail\s*=\s*"[^"]+"',  # detail="message"
    r"detail\s*=\s*\'[^\']+\'",  # detail='message'
    r'message\s*=\s*"[^"]+"',  # message="message"
    r"message\s*=\s*\'[^\']+\'",  # message='message'
    r'error\s*=\s*"[^"]+"',  # error="message"
    r"error\s*=\s*\'[^\']+\'",  # error='message'
]

# URL patterns
URL_PATTERNS = [
    r'http://[^\s"\'\)]+',
    r'https://[^\s"\'\)]+',
    r"localhost:\d+",
]

# Common hardcoded strings that should be constants
COMMON_HARDCODED_STRINGS = [
    "Task not found",
    "User not found",
    "Failed to",
    "Invalid",
    "Error",
    "Success",
    "Unauthorized",
    "Forbidden",
    "Not found",
    "Internal server error",
]


class ConstantChecker(ast.NodeVisitor):
    """AST visitor to check for hardcoded strings."""

    def __init__(self, file_path: Path):
        """
        Initialize constant checker.

        Args:
            file_path: Path to file being checked
        """
        self.file_path = file_path
        self.issues = []

    def visit_Raise(self, node: ast.Raise) -> None:
        """Visit raise statements to check for hardcoded error messages."""
        if node.exc and isinstance(node.exc, ast.Call):
            # Check arguments for string literals
            for arg in node.exc.args:
                if (
                    isinstance(arg, ast.Constant)
                    and isinstance(arg.value, str)
                    and any(
                        pattern.lower() in arg.value.lower() for pattern in COMMON_HARDCODED_STRINGS
                    )
                ):
                    self.issues.append(
                        f"{self.file_path}:{node.lineno}: Potential hardcoded error message: '{arg.value[:50]}...'"
                    )

    def visit_Constant(self, node: ast.Constant) -> None:
        """Visit string constants to check for hardcoded values."""
        if isinstance(node.value, str) and len(node.value) > 5:
            # Check for URLs
            if re.search(r"https?://", node.value) and not isinstance(
                node.parent, (ast.Expr, ast.Str)
            ):
                self.issues.append(
                    f"{self.file_path}:{node.lineno}: Potential hardcoded URL: '{node.value[:50]}...'"
                )

            # Check for common error message patterns
            if any(
                pattern.lower() in node.value.lower() for pattern in COMMON_HARDCODED_STRINGS
            ) and not isinstance(node.parent, (ast.Expr, ast.Str)):
                # Check if it's in a function call that might be an exception
                parent = node.parent
                if isinstance(parent, ast.Call):
                    # Check if it's a keyword argument that looks like an error message
                    for keyword in parent.keywords:
                        if keyword.arg in ["detail", "message", "error"] and keyword.value == node:
                            self.issues.append(
                                f"{self.file_path}:{node.lineno}: Potential hardcoded {keyword.arg}: '{node.value[:50]}...'"
                            )


def check_file_for_constants(file_path: Path) -> list[str]:
    """
    Check a file for hardcoded strings that should use constants.

    Args:
        file_path: Path to file to check

    Returns:
        List of issue messages
    """
    issues = []

    try:
        with file_path.open(encoding="utf-8") as f:
            content = f.read()

        # Check for patterns in raw content
        for pattern in ERROR_MESSAGE_PATTERNS:
            matches = re.finditer(pattern, content)
            for match in matches:
                line_num = content[: match.start()].count("\n") + 1
                issues.append(
                    f"{file_path}:{line_num}: Potential hardcoded string in exception/error: {match.group()[:60]}..."
                )

        # Parse AST and check for issues
        try:
            tree = ast.parse(content, filename=str(file_path))
            checker = ConstantChecker(file_path)
            checker.visit(tree)
            issues.extend(checker.issues)
        except SyntaxError:
            # Skip files with syntax errors (ruff will catch these)
            pass

    except Exception as e:
        issues.append(f"{file_path}: Error checking constants: {e!s}")

    return issues


def check_directory(directory: Path) -> list[str]:
    """
    Check all Python files in a directory.

    Args:
        directory: Directory to check

    Returns:
        List of issue messages
    """
    issues = []

    if not directory.exists():
        return issues

    for file_path in directory.rglob("*.py"):
        # Skip ignored directories
        if any(ignore_dir in file_path.parts for ignore_dir in IGNORE_DIRS):
            continue

        # Skip ignored files
        if file_path.name in IGNORE_FILES:
            continue

        file_issues = check_file_for_constants(file_path)
        issues.extend(file_issues)

    return issues


def main() -> int:
    """
    Main function to check for hardcoded constants.

    Returns:
        Exit code (0 for success, 1 for issues found)
    """
    backend_dir = Path(__file__).parent.parent
    all_issues = []

    # Check each directory
    for check_dir in CHECK_DIRS:
        dir_path = backend_dir / check_dir
        issues = check_directory(dir_path)
        all_issues.extend(issues)

    # Print results
    if all_issues:
        print("⚠️  Potential hardcoded strings found (should use constants):")
        print()
        for issue in all_issues:
            print(f"  {issue}")
        print()
        print(f"⚠️  Found {len(all_issues)} potential issue(s)")
        print("Note: These are suggestions. Some strings may be acceptable.")
        return 1

    print("✅ No obvious hardcoded strings detected!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
