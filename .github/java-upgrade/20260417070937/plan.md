# Java Upgrade Plan

**Session ID:** 20260417070937

**Project Name:** COMP4442 Service Computing Backend

**Current Branch:** AWS_Backend

**Current Commit ID:** 953fea5ec30c16fa95e0ac38f5e0291f46ccd50f

**Generated On:** 2026-04-17T07:09:37Z

## Guidelines

None specified.

## Available Tools

<!-- Rules for Available Tools section:
- List JDK versions available on the system, including paths.
- List build tool versions available, including paths.
- Mark any required tools that need to be installed as <TO_BE_INSTALLED> with a note on which step requires it.
- Mark any build tools that need upgrading as <TO_BE_UPGRADED> with a note on compatibility requirements.
- Include wrapper-defined versions if applicable.
-->

### JDKs
- Java 21.0.7: /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home/bin
- Java 22.0.1: /Library/Java/JavaVirtualMachines/jdk-22.jdk/Contents/Home/bin
- Java 25.0.2: /opt/homebrew/Cellar/openjdk/25.0.2/libexec/openjdk.jdk/Contents/Home/bin

### Build Tools
- Maven 3.9.14: /opt/homebrew/Cellar/maven/3.9.14/bin <TO_BE_UPGRADED> (Maven 4.0+ required for Java 25 compatibility)

## Technology Stack

<!-- Rules for Technology Stack section:
- Identify core tech stack across ALL modules (direct deps + upgrade-critical deps).
- Include build tool (Maven/Gradle) and build plugins (maven-compiler-plugin, etc.) in the technology stack analysis — these are upgrade-critical even though they are not runtime dependencies.
- Flag EOL dependencies (high priority for upgrade).
- Determine compatibility against upgrade goals; populate "Technology Stack" and "Derived Upgrades".
-->

| Component | Current Version | Compatibility with Java 25 | Notes |
|-----------|-----------------|----------------------------|-------|
| Java | 17 | No | Requires upgrade to 25 |
| Spring Boot | 3.2.0 | Partial | Spring Boot 3.x supports up to Java 21; Spring Boot 4.0 required for Java 25 |
| Maven | 3.9.14 | No | Maven 4.0+ required for Java 25 |
| PostgreSQL Driver | Latest (via Spring Boot) | Yes | |
| H2 Database | Latest (via Spring Boot) | Yes | |
| Lombok | 1.18.24 | Yes | Compatible with Java 25 |
| Jackson | Latest (via Spring Boot) | Yes | |
| Spring Boot Maven Plugin | Latest (via Spring Boot) | Yes | |

## Derived Upgrades

<!-- Rules for Derived Upgrades section:
- Based on technology stack analysis, list all required upgrades.
- Include intermediate versions if needed for compatibility.
- Ensure upgrades are necessary and meaningful.
-->

- Java: 17 → 25
- Spring Boot: 3.2.0 → 4.0.x (latest stable)
- Maven: 3.9.14 → 4.0.x (latest)
- Lombok: 1.18.24 → latest compatible version if needed

## Key Challenges

<!-- Rules for Key Challenges section:
- Identify high-risk areas for the upgrade.
- Include breaking changes, EOL components, complex migrations.
- Prioritize challenges that could cause compilation or test failures.
-->

- Major Spring Boot version upgrade (3.x → 4.x) may introduce breaking changes in configuration, dependencies, and APIs.
- Maven 4.0 upgrade may require changes in pom.xml or build scripts.
- Java 25 is the latest LTS; ensure all dependencies support it.
- Potential issues with Lombok and annotation processing in newer Java versions.

## Upgrade Steps

<!-- Rules for Upgrade Steps section:
- Design step sequence: stepwise dependency upgrades; use intermediates to avoid large jumps breaking builds.
- Step 1 (MANDATORY): Setup Environment - Install all JDKs/build tools marked <TO_BE_INSTALLED>
- Step 2 (MANDATORY): Setup Baseline - Stash changes via #appmod-version-control, run compile/test with current JDK, document results
- Steps 3-N: Upgrade steps - dependency order, high-risk early, isolated breaking changes. Compilation must pass (both main and test code); test failures documented for Final Validation.
- Final step (MANDATORY): Final Validation - verify all goals met, all TODOs resolved, achieve Upgrade Success Criteria through iterative test & fix loop.
- Each step MUST change code/config. NO steps for pure analysis/validation. Merge small related changes.
- Necessary/Meaningful steps only: "Does this step modify project files?"
-->

1. **Setup Environment**: Install/upgrade required tools (JDK 25 available, upgrade Maven to 4.0+).
2. **Setup Baseline**: Run compilation and tests with current Java 17 to establish baseline.
3. **Upgrade Build Tool**: Update Maven to 4.0+ for Java 25 compatibility.
4. **Upgrade Java Version**: Change Java version in pom.xml to 25.
5. **Upgrade Spring Boot**: Update Spring Boot to 4.0.x for Java 25 support.
6. **Update Dependencies**: Update any incompatible dependencies (e.g., Lombok if needed).
7. **Final Validation**: Run full compilation and tests with Java 25, fix any issues.

## Plan Review

<!-- Rules for Plan Review section:
- Verify all placeholders filled in plan.md, check for missing coverage/infeasibility/limitations
- Revise plan as needed for completeness and feasibility; document unfixable limitations in "Plan Review" section
- Ensure all sections of plan.md are fully populated (per Template compliance rule) and all HTML comments removed
-->

The plan covers all necessary upgrades for Java 17 to 25, including Spring Boot and Maven upgrades. No unfixable limitations identified. All placeholders have been replaced.

## Options

<!-- Options section for user preferences -->
Run tests before and after the upgrade: true