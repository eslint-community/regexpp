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
    enterAlternative: (index: number) => void
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
    private readonly groupName = new Set<string>()

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
    public leaveDisjunction(): void {
        // Prior to ES2025, it does not manage disjunction scopes.
    }
}

/**
 * Track disjunction structure to determine whether a duplicate
 * capture group name is allowed because it is in a separate branch.
 */
class BranchID {
    public readonly parent: BranchID | null
    private readonly base: BranchID
    public constructor(parent: BranchID | null, base: BranchID | null) {
        // Parent disjunction branch
        this.parent = parent
        // Identifies this set of sibling branches
        this.base = base ?? this
    }

    /**
     * A branch is separate from another branch if they or any of
     * their parents are siblings in a given disjunction
     */
    public separatedFrom(other: BranchID): boolean {
        if (this.base === other.base && this !== other) {
            return true
        }
        if (other.parent && this.separatedFrom(other.parent)) {
            return true
        }
        return this.parent?.separatedFrom(other) ?? false
    }

    public child() {
        return new BranchID(this, null)
    }

    public sibling() {
        return new BranchID(this.parent, this.base)
    }
}

export class GroupSpecifiersAsES2025 implements GroupSpecifiers {
    private branchID = new BranchID(null, null)
    private readonly groupNames = new Map<string, BranchID[]>()

    public clear(): void {
        this.branchID = new BranchID(null, null)
        this.groupNames.clear()
    }

    public isEmpty(): boolean {
        return !this.groupNames.size
    }

    public enterDisjunction(): void {
        this.branchID = this.branchID.child()
    }

    public enterAlternative(index: number): void {
        if (index === 0) {
            return
        }
        this.branchID = this.branchID.sibling()
    }

    public leaveDisjunction(): void {
        this.branchID = this.branchID.parent!
    }

    public hasInPattern(name: string): boolean {
        return this.groupNames.has(name)
    }

    public hasInScope(name: string): boolean {
        const branches = this.groupNames.get(name)
        if (!branches) {
            return false
        }
        for (const branch of branches) {
            if (!branch.separatedFrom(this.branchID)) {
                return true
            }
        }
        return false
    }

    public addToScope(name: string): void {
        const branches = this.groupNames.get(name)
        if (branches) {
            branches.push(this.branchID)
            return
        }
        this.groupNames.set(name, [this.branchID])
    }
}
