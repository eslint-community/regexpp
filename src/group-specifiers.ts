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
     * Called when visiting the Alternative.
     * For ES2025, manage nesting with new Alternative scopes.
     */
    enterAlternative: () => void
    /**
     * Called when leaving the Alternative.
     */
    leaveAlternative: () => void
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
    public enterAlternative(): void {
        // Prior to ES2025, it does not manage alternative scopes.
    }

    // eslint-disable-next-line class-methods-use-this
    public leaveAlternative(): void {
        // Prior to ES2025, it does not manage alternative scopes.
    }
}

export class GroupSpecifiersAsES2025 implements GroupSpecifiers {
    private groupNamesInAlternative = new Set<string>()
    private upperGroupNamesStack: Set<string>[] = []

    private groupNamesInPattern = new Set<string>()

    public clear(): void {
        this.groupNamesInAlternative.clear()
        this.upperGroupNamesStack.length = 0
        this.groupNamesInPattern.clear()
    }

    public isEmpty(): boolean {
        return !this.groupNamesInPattern.size
    }

    public enterAlternative(): void {
        this.upperGroupNamesStack.push(this.groupNamesInAlternative)
        this.groupNamesInAlternative = new Set(this.groupNamesInAlternative)
    }

    public leaveAlternative(): void {
        this.groupNamesInAlternative = this.upperGroupNamesStack.pop()!
    }

    public hasInPattern(name: string): boolean {
        return this.groupNamesInPattern.has(name)
    }

    public hasInScope(name: string): boolean {
        return this.groupNamesInAlternative.has(name)
    }

    public addToScope(name: string): void {
        this.groupNamesInAlternative.add(name)
        this.groupNamesInPattern.add(name)
    }
}
