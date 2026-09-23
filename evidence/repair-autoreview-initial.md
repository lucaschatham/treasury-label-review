autoreview findings: 3
[P1] [P1] Review declared foreign origins on domestic applications
src/review.js:169
When `imported` is false, this branch always marks country of origin N/A without examining `declarations.countries`. Artwork that explicitly says `PRODUCT OF FRANCE` while the application claims a domestic product therefore receives no warning. Treat any declared origin on a domestic application as requiring review, since it directly contradicts the application classification.

[P2] [P2] Join nonempty wrapped class and origin declarations
src/declarations.js:40
Continuation handling only runs when the first line leaves `value` empty. Common declarations such as `CLASS: KENTUCKY` followed by `STRAIGHT BOURBON WHISKEY`, or `PRODUCT OF UNITED` followed by `STATES`, are stored as incomplete values and cannot match the application. The adjacent continuation needs conservative joining for nonempty class and origin values as well.

[P2] [P2] Exclude role-owned lines from prominent brand text
src/layout.js:27
Every sufficiently tall line can enter `brandText`, including declarations such as `BOTTLED BY ...` or `PRODUCED BY ...`. If such a line is aligned and close to the actual brand, line 37 appends it, so an otherwise exact brand is reported as unclear. Filter role-owned declaration lines before selecting and extending the prominent brand region.

overall: patch is incorrect (0.99)
The snapshot still contains the three stated repair targets: domestic applications ignore explicit origin declarations, nonempty wrapped class and origin declarations are not joined, and role-owned prominent text remains eligible for brand extraction. These cause missed contradictions and false review results in normal label layouts.
