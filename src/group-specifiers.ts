/**
 * Holds information for all GroupSpecifiers included in the pattern.
 */
export interface GroupSpecifiers {
    /**
     * @returns true if there are no GroupSpecifiers included in the pattern.
     */
    isEmpty: () => boolean
    clear: () => void
    /**
     * Called when visiting the Disjunction.
     * For ES2025, manage nesting with new Disjunction scopes.
     */
    enterDisjunction: () => void
    /**
     * Called when visiting the Alternative.
     * For ES2025, manage nesting with new Alternative scopes.
     */
    enterAlternative: () => void
    /**
     * Called when leaving the Alternative.
     */
    leaveAlternative: () => void
    /**
     * Called when leaving the Disjunction.
     */
    leaveDisjunction: () => unknown
    /**
     * Checks whether the given group name is within the pattern.
     */
    hasInPattern: (name: string) => boolean
    /**
     * Checks whether the given group name is within the current scope.
     */
    hasInScope: (name: string) => boolean
    /**
     * Adds the given group name to the current scope.
     */
    addToScope: (name: string) => void
}

export class GroupSpecifiersAsES2018 implements GroupSpecifiers {
    private groupName = new Set<string>()

    public clear(): void {
        this.groupName.clear()
    }

    public isEmpty(): boolean {
        return !this.groupName.size
    }

    public hasInPattern(name: string): boolean {
        return this.groupName.has(name)
    }

    public hasInScope(name: string): boolean {
        return this.hasInPattern(name)
    }

    public addToScope(name: string): void {
        this.groupName.add(name)
    }

    // eslint-disable-next-line class-methods-use-this
    public enterDisjunction(): void {
        // Prior to ES2025, it does not manage disjunction scopes.
    }

    // eslint-disable-next-line class-methods-use-this
    public enterAlternative(): void {
        // Prior to ES2025, it does not manage alternative scopes.
    }

    // eslint-disable-next-line class-methods-use-this
    public leaveAlternative(): void {
        // Prior to ES2025, it does not manage alternative scopes.
    }

    // eslint-disable-next-line class-methods-use-this
    public leaveDisjunction(): void {
        // Prior to ES2025, it does not manage disjunction scopes.
    }
}

export class GroupSpecifiersAsES2025 implements GroupSpecifiers {
    private groupNamesAddedInDisjunction = new Set<string>()
    private groupNamesAddedInUpperDisjunctionStack: Set<string>[] = []
    private groupNamesInScope = new Set<string>()
    private groupNamesInUpperScopeStack: Set<string>[] = []

    private groupNamesInPattern = new Set<string>()

    public clear(): void {
        this.groupNamesAddedInDisjunction.clear()
        this.groupNamesAddedInUpperDisjunctionStack.length = 0
        this.groupNamesInScope.clear()
        this.groupNamesInUpperScopeStack.length = 0
        this.groupNamesInPattern.clear()
    }

    public isEmpty(): boolean {
        return !this.groupNamesInPattern.size
    }

    public enterDisjunction(): void {
        this.groupNamesAddedInUpperDisjunctionStack.push(
            this.groupNamesAddedInDisjunction,
        )
        // Clear groupNamesAddedInDisjunction to store the groupName added in this Disjunction.
        this.groupNamesAddedInDisjunction = new Set()
    }

    public enterAlternative(): void {
        this.groupNamesInUpperScopeStack.push(this.groupNamesInScope)
        this.groupNamesInScope = new Set(this.groupNamesInScope)
    }

    public leaveAlternative(): void {
        this.groupNamesInScope = this.groupNamesInUpperScopeStack.pop()!
    }

    public leaveDisjunction(): void {
        const groupNamesAddedInDisjunction = this.groupNamesAddedInDisjunction
        this.groupNamesAddedInDisjunction =
            this.groupNamesAddedInUpperDisjunctionStack.pop()!
        for (const groupName of groupNamesAddedInDisjunction) {
            // Adds the groupName added in Disjunction to groupNamesInScope.
            this.groupNamesInScope.add(groupName)
            // Adds the groupName added in Disjunction to the upper Disjunction.
            this.groupNamesAddedInDisjunction.add(groupName)
        }
    }

    public hasInPattern(name: string): boolean {
        return this.groupNamesInPattern.has(name)
    }

    public hasInScope(name: string): boolean {
        return this.groupNamesInScope.has(name)
    }

    public addToScope(name: string): void {
        this.groupNamesInScope.add(name)
        this.groupNamesAddedInDisjunction.add(name)
        this.groupNamesInPattern.add(name)
    }
}
