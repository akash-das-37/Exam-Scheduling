# Intelligent Examination Scheduling Algorithm
## Google OR-Tools CP-SAT Formulation & Hybrid Optimization

### 1. Mathematical Formulation
Let:
- $E = \{e_1, e_2, \dots, e_n\}$ be the set of examination events.
- $D = \{d_1, d_2, \dots, d_m\}$ be the set of valid examination dates (excluding non-working days and declared holidays).
- $T = \{t_1, t_2, \dots, t_k\}$ be the set of daily time slots.
- $P = D \times T = \{p_{1}, p_{2}, \dots, p_{|D| \times |T|}\}$ be the set of all discrete scheduling periods.
- $S = \{s_1, s_2, \dots, s_u\}$ be the set of students.
- $R(e) \subseteq S$ be the set of students registered for examination $e$.
- $V = \{r_1, r_2, \dots, r_w\}$ be the set of examination rooms, each with seating capacity $C(r)$.
- $F = \{f_1, f_2, \dots, f_y\}$ be the set of faculty members.

### 2. Decision Variables
- Binary variable $X_{e, p} \in \{0, 1\}$:
  $$X_{e, p} = \begin{cases} 1 & \text{if examination } e \text{ is scheduled at period } p = (d, t) \\ 0 & \text{otherwise} \end{cases}$$

### 3. Hard Constraints

#### H1: Universal Scheduling
Every examination $e \in E$ must be assigned to exactly one period $p$:
$$\forall e \in E: \quad \sum_{p \in P} X_{e, p} = 1$$

#### H2: Student Conflict Prevention (Zero Overlap)
Two exams $e_a$ and $e_b$ sharing at least one registered student ($R(e_a) \cap R(e_b) \neq \emptyset$) cannot be scheduled in the same period $p$:
$$\forall p \in P, \forall e_a, e_b \in E \text{ with } e_a \neq e_b \text{ and } R(e_a) \cap R(e_b) \neq \emptyset: \quad X_{e_a, p} + X_{e_b, p} \le 1$$
*Note: This automatically and strictly prevents Regular vs. Backlog clashes because student registrations explicitly include both.*

#### H3: Global Room Seating Capacity Limit
For any period $p$, the total number of students taking examinations at that time must not exceed the aggregate seating capacity of all available rooms $\sum_{r \in V} C(r)$:
$$\forall p \in P: \quad \sum_{e \in E} X_{e, p} \cdot |R(e)| \le \sum_{r \in V} C(r)$$

#### H4: Date Range & Duration Respect
Examinations must only be placed in periods where their duration matches the time slot's window and falls within the allowable date range $[D_{start}(e), D_{end}(e)]$.

### 4. Soft Constraints & Objective Function
We define penalty metrics minimized by the CP-SAT solver:

1. **Student Exam Spread (Consecutive Exam Minimization)**:
   Penalize when a student has examinations on consecutive calendar days ($d$ and $d+1$) to reduce academic stress and allow study intervals:
   $$\text{Penalty}_{\text{consec}} = W_{\text{consec}} \sum_{s \in S} \sum_{d \in D} \text{has\_exam}(s, d) \cdot \text{has\_exam}(s, d+1)$$

2. **Daily Load Balancing**:
   Distribute examination events evenly across available dates:
   $$\text{Penalty}_{\text{balance}} = W_{\text{balance}} \sum_{d \in D} (\text{count}(d) - \overline{\text{count}})^2$$

3. **Time Slot Preference**:
   Avoid undesirable slots according to institutional weights.

### 5. Multi-Phase Resource Allocation
1. **Phase 1: CP-SAT Core Schedule**:
   Find the optimal $(e \to p)$ mapping satisfying all H1-H4 and minimizing soft penalties.
2. **Phase 2: Knapsack/Bin-Packing Room Allocation**:
   For each period $p$, exams scheduled in $p$ are assigned to specific rooms such that $|R(e)| \le \sum_{r \in Allocated(e)} C(r)$ and no room is assigned to two exams in the same period.
3. **Phase 3: Workload-Balanced Invigilator Assignment**:
   Assign faculty to rooms adhering to availability declarations and balancing duties across all faculty up to $MaxDuty(f)$.

### 6. Rule-Based Assistance & Explainability
When an infeasibility occurs or when manual modifications are attempted, the deterministic rule engine checks:
- Exact pairwise student clashes ($R(e_1) \cap R(e_2)$).
- Insufficient aggregate capacity per slot.
- Date limits or insufficient slots for the number of conflicting exams.
- Alternative slot recommendations ranked by fewest student clashes and highest spare room capacity.
