"""Validation script to check adherence to coding standards."""

import ast
from pathlib import Path
import sys

# Maximum file size in lines
MAX_FILE_LINES = 500

# Directories to check
CHECK_DIRS = ["core", "routers", "services", "schemas", "models", "utils"]

# Directories to ignore
IGNORE_DIRS = ["__pycache__", ".git", "alembic", "tests", "scripts"]

# Files to ignore
IGNORE_FILES = ["__init__.py"]


class ValidationError(Exception):
    """Custom exception for validation errors."""


def check_file_size(file_path: Path) -> list[str]:
    """
    Check if file exceeds maximum line count.

    Args:
        file_path: Path to file to check

    Returns:
        List of error messages (empty if no errors)
    """
    errors = []
    try:
        with file_path.open(encoding="utf-8") as f:
            line_count = sum(1 for _ in f)

        if line_count > MAX_FILE_LINES:
            errors.append(f"{file_path}: File exceeds {MAX_FILE_LINES} lines ({line_count} lines)")
    except Exception as e:
        errors.append(f"{file_path}: Error reading file: {e!s}")

    return errors


def check_module_docstring(file_path: Path) -> list[str]:
    """
    Check if module has a docstring.

    Args:
        file_path: Path to file to check

    Returns:
        List of error messages (empty if no errors)
    """
    errors = []
    try:
        with file_path.open(encoding="utf-8") as f:
            content = f.read()

        try:
            tree = ast.parse(content, filename=str(file_path))
            if not ast.get_docstring(tree) and file_path.name not in IGNORE_FILES:
                errors.append(f"{file_path}: Missing module-level docstring")
        except SyntaxError:
            # Skip files with syntax errors (ruff will catch these)
            pass
    except Exception as e:
        errors.append(f"{file_path}: Error checking docstring: {e!s}")

    return errors


def check_public_function_docstrings(file_path: Path) -> list[str]:
    """
    Check if public functions and classes have docstrings.

    Args:
        file_path: Path to file to check

    Returns:
        List of error messages (empty if no errors)
    """
    errors = []
    try:
        with file_path.open(encoding="utf-8") as f:
            content = f.read()

        try:
            tree = ast.parse(content, filename=str(file_path))

            for node in ast.walk(tree):
                # Check function definitions (not private)
                if (
                    isinstance(node, ast.FunctionDef)
                    and not node.name.startswith("_")
                    and not ast.get_docstring(node)
                ):
                    errors.append(
                        f"{file_path}:{node.lineno}: Function '{node.name}' missing docstring"
                    )

                # Check class definitions
                if isinstance(node, ast.ClassDef):
                    if not ast.get_docstring(node):
                        errors.append(
                            f"{file_path}:{node.lineno}: Class '{node.name}' missing docstring"
                        )

                    # Check public methods in classes
                    for item in node.body:
                        if (
                            isinstance(item, ast.FunctionDef)
                            and not item.name.startswith("_")
                            and not ast.get_docstring(item)
                        ):
                            errors.append(
                                f"{file_path}:{item.lineno}: Method '{node.name}.{item.name}' missing docstring"
                            )
        except SyntaxError:
            # Skip files with syntax errors (ruff will catch these)
            pass
    except Exception as e:
        errors.append(f"{file_path}: Error checking function docstrings: {e!s}")

    return errors


def check_type_hints(file_path: Path) -> list[str]:
    """
    Check if functions have type hints.

    Args:
        file_path: Path to file to check

    Returns:
        List of warning messages (empty if no warnings)
    """
    warnings = []
    try:
        with file_path.open(encoding="utf-8") as f:
            content = f.read()

        try:
            tree = ast.parse(content, filename=str(file_path))

            for node in ast.walk(tree):
                # Check function definitions (not private)
                if isinstance(node, ast.FunctionDef) and not node.name.startswith("_"):
                    # Check return type annotation
                    if node.returns is None:
                        warnings.append(
                            f"{file_path}:{node.lineno}: Function '{node.name}' missing return type hint"
                        )

                    # Check parameter type annotations
                    for arg in node.args.args:
                        if arg.arg != "self" and arg.annotation is None:
                            warnings.append(
                                f"{file_path}:{node.lineno}: Function '{node.name}' parameter '{arg.arg}' missing type hint"
                            )
        except SyntaxError:
            # Skip files with syntax errors (ruff will catch these)
            pass
    except Exception as e:
        warnings.append(f"{file_path}: Error checking type hints: {e!s}")

    return warnings


def check_import_organization(file_path: Path) -> list[str]:
    """
    Check if imports are organized correctly.

    Args:
        file_path: Path to file to check

    Returns:
        List of warning messages (empty if no warnings)
    """
    warnings = []
    try:
        with file_path.open(encoding="utf-8") as f:
            lines = f.readlines()

        import_sections = []
        current_section = []
        in_imports = False

        for i, line in enumerate(lines, 1):
            stripped = line.strip()

            # Skip comments and blank lines within imports
            if stripped.startswith("#") or not stripped:
                if in_imports:
                    current_section.append((i, line))
                continue

            # Check if this is an import line
            if stripped.startswith(("import ", "from ")):
                if not in_imports:
                    in_imports = True
                current_section.append((i, line))
            # End of imports
            elif in_imports:
                import_sections.append(current_section)
                current_section = []
                in_imports = False

        # Check if there are multiple import sections (should be grouped)
        if len(import_sections) > 1:
            warnings.append(
                f"{file_path}: Imports should be grouped together (found {len(import_sections)} separate sections)"
            )
    except Exception as e:
        warnings.append(f"{file_path}: Error checking import organization: {e!s}")

    return warnings


def validate_directory(directory: Path) -> tuple[list[str], list[str]]:
    """
    Validate all Python files in a directory.

    Args:
        directory: Directory to validate

    Returns:
        Tuple of (errors, warnings)
    """
    errors = []
    warnings = []

    if not directory.exists():
        return errors, warnings

    for file_path in directory.rglob("*.py"):
        # Skip ignored directories
        if any(ignore_dir in file_path.parts for ignore_dir in IGNORE_DIRS):
            continue

        # Skip ignored files
        if file_path.name in IGNORE_FILES:
            continue

        # Check file size
        errors.extend(check_file_size(file_path))

        # Check module docstring
        errors.extend(check_module_docstring(file_path))

        # Check function/class docstrings
        errors.extend(check_public_function_docstrings(file_path))

        # Check type hints (warnings only)
        warnings.extend(check_type_hints(file_path))

        # Check import organization (warnings only)
        warnings.extend(check_import_organization(file_path))

    return errors, warnings


def main() -> int:
    """
    Main validation function.

    Returns:
        Exit code (0 for success, 1 for errors)
    """
    backend_dir = Path(__file__).parent.parent
    errors = []
    warnings = []

    # Validate each directory
    for check_dir in CHECK_DIRS:
        dir_path = backend_dir / check_dir
        dir_errors, dir_warnings = validate_directory(dir_path)
        errors.extend(dir_errors)
        warnings.extend(dir_warnings)

    # Print results
    if errors:
        print("❌ Validation Errors:")
        for error in errors:
            print(f"  {error}")
        print()

    if warnings:
        print("⚠️  Validation Warnings:")
        for warning in warnings:
            print(f"  {warning}")
        print()

    if errors:
        print(f"❌ Found {len(errors)} error(s) and {len(warnings)} warning(s)")
        return 1

    if warnings:
        print(f"✅ No errors found, but {len(warnings)} warning(s) detected")
        return 0

    print("✅ All validation checks passed!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
