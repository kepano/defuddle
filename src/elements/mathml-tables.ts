// Compact lookup tables for MathML-to-LaTeX conversion.
// Single-codepoint tables are pure-ASCII delta-encoded ("<base36-delta>\t<latex>" per line)
// so Terser's ascii_only output stays small, and are decoded lazily on first use.

const SHARED_DATA = "z\t\\#\n1\t\\$\n1\t\\%\n1\t\\&\n1i\t\\backslash\n1z\t\\pounds\n2\t\\yen\n6\t\\ll\n1\t\\neg\n5\t\\pm\n6\t\\cdot\n1\t,\n3\t\\gg\n1\t\\dfrac{1}{4}\n1\t\\dfrac{1}{2}\nq\t\\times\n1\t\\emptyset\nv\t\\div\n1c\t\\hbar\n3b\t\\eta\n4e\tc\n9\t\\Lambda\n1j\tr\n2k\t \nr\t\\cdot\n3v\t;\nl\t\\Gamma\n1\t\\Delta\n4\t\\Theta\n8\t\\Pi\n1\tP\n2\t\\Sigma\n3\t\\Phi\n2\t\\Psi\n1\t\\Omega\n8\t\\alpha\n1\t\\beta\n1\t\\gamma\n1\t\\delta\n2\t\\zeta\n1\t\\eta\n1\t\\theta\n1\t\\iota\n1\t\\kappa\n1\t\\lambda\n1\t\\mu\n1\t\\nu\n3\t\\pi\n1\t\\rho\n2\t\\sigma\n1\t\\tau\n1\t\\upsilon\n1\t\\varphi\n1\t\\chi\n1\t\\psi\n1\t\\omega\n9\t\\Upsilon\n3\t\\phi\ns\t\\varrho\n4\t\\epsilon\n16\t\\prod\nv\to\n6\t\\phi\ne\t\\hbar\nw\t\\theta\n1\t\\theta\n39\t\\theta\n4h\t:\nrf\t\\mid\nsi\t\\circ\n62\t\\prime\n14x\t\\nabla\n27k\ti\n4w\t\\bar{u}\n1h\t\\parallel\n6\t\\text{``}\n1\t\\\"\n3\t\\dagger\n1\t\\ddagger\n5\t\\ldots\no\t\\overline\nz\t\n1\t\n1\t\n1\t\np\t^{(}\n1\t^{)}\n1\t^{n}\nq\t_{n}\nj\t\\euro\n2f\t\\text{\\textdegree C}\n4\t\\varepsilon\n2\t\\text{\\textdegree F}\n6\t\\hbar\nd\t\\mathfrak{R}\na\t\\Omega\n1\t\\mho\nw\t\\text{e}\n21\t\\leftarrow\n1\t\\uparrow\n1\t\\rightarrow\n1\t\\downarrow\n1\t\\leftrightarrow\n7\t\\nrightarrow\n1j\t\\Rightarrow\n1a\t\\forall\n2\t\\partial\n1\t\\exists\n2\t\\emptyset\n1\t\\Delta\n1\t\\nabla\n8\t\\prod\n2\t\\sum\n8\t\\cdot\n1\t\\sqrt{}\n4\t\\infty\n2\t\\angle\n3\t\\mid\n2\t\\parallel\n4\t\\cap\n1\t\\cup\n1\t\\int\n3\t\\oint\n7\t\\because\nj\t\\approx\no\t\\neq\n4\t\\leq\n1h\t\\bigodot\nb\t\\top\ns\t\\wedge\n1\t\\vee\n1\t\\cap\n1\t\\cup\n1\t\\diamond\n1\t\\cdot\n1\t\\star\n14\t\\vdots\n3\t\\ddots\nn\t\\lceil\n1\t\\rceil\n1\t\\lfloor\n1\t\\rfloor\nu\t\\langle\n1\t\\rangle\n36\t\\mid\n9\t\\mid\nn\t-\n92\t\\mid\n1e\t\\perp\n2c\t\\blacksquare\np\t\\square\na\t\\square\n6\t\\square\n2\t\\triangle\ns\t\\circle\n90\t\\checkmark\n1\t\\checkmark\n1\t\\times\n2\t\\times\n5t\t\\langle\n1\t\\rangle\n9\t\\circlearrowleft\n1\t\\circlearrowright\n8w\t\\rightarrow\n1\t\\uparrow\n1\t\\downarrow\n1\t\\Lsh\n1\t\\Rsh\n1\t\\downarrow\n1\t\\downarrow\n20\t\\cdot\nx\t\\measuredangle\n7\t\\measuredangle\n1\t\\measuredangle\n1\t\\measuredangle\n1\t\\measuredangle\n1\t\\measuredangle\n1\t\\measuredangle\n7\t\\ominus\n1v\t/\n17i\t\\langle\n6d\t\\cdot\n6rq\t+\nri\t\\pm\n23ts\t\\delta\nq\t\\phi\n45\t\\epsilon";
const OP_ONLY_DATA = "14\t\\left(\\right.\n1\t\\left.\\right)\n1\t\\star\n1d\t\\left[\\right.\n2\t\\left]\\right.\n1\t\\hat\n1\t\\underline\ns\t\\left\\{\\right.\n1\t\\left|\\right.\n1\t\\left.\\right\\}\n1\t\\sim\n14\t\\mid\n2\t\\cdot\\cdot\n2\ta\n5\t\\bar\n1\t\\circ\n2\t2\n1\t3\n6\t1\n1\to\nek\t\\hat\n1\t\n6\t\\_\nc\t\\cdot\n1\t\\circ\n2\t\\sim\n1\t\\sim\nq\t\\sim\nb\t\\hat\n4j\t\\Upsilon\nq\t\\omicron\n1j\t\\ni\n5k2\t`\n1\t'\n1\t,\n1\t`\n3\t,,\n1\t``\n3\t\\cdot\ng\t'\n1\t''\n1\t'''\n1\t`\n1\t``\n1\t```\nc\t-\n1\t/\nj\t''''\nz\t^{+}\n1\t^{-}\n1\t^{=}\n2n\t\\square\n1\t\\square\n2x\t\\mathbb{D}\n1\td\n27\t\\updownarrow\n1\t\\nwarrow\n1\t\\nearrow\n1\t\\searrow\n1\t\\swarrow\n1\t\n2\t\\nwarrow\n1\t\\nearrow\n1\t\\twoheadleftarrow\n1\t\\uparrow\n1\t\\twoheadrightarrow\n1\t\\downarrow\n1\t\\leftarrowtail\n1\t\\rightarrowtail\n1\t\\leftarrowtail\n1\t\\uparrow\n1\t\\mapsto\n1\t\\downarrow\n1\t\\underline{\\updownarrow}\n1\t\\hookleftarrow\n1\t\\hookrightarrow\n1\t\\looparrowleft\n1\t\\looparrowright\n1\t\\leftrightsquigarrow\n1\t\n1\t\\swarrow\n1\t\\Lsh\n1\t\\Rsh\n1\t\\Lsh\n1\t\\Rsh\n1\t\\searrow\n1\t\\swarrow\n1\t\\curvearrowleft\n1\t\\curvearrowright\n1\t\\overline{\\nwarrow}\n1\t\\leftrightarrows\n1\t\\circlearrowleft\n1\t\\circlearrowright\n1\t\\leftharpoonup\n1\t\\leftharpoondown\n1\t\\upharpoonright\n1\t\\upharpoonleft\n1\t\\rightharpoonup\n1\t\\rightharpoondown\n1\t\\downharpoonright\n1\t\\downharpoonleft\n1\t\\rightleftarrows\n1\t\n1\t\\leftrightarrows\n1\t\\leftleftarrows\n1\t\\upuparrows\n1\t\\rightrightarrows\n1\t\\downdownarrows\n1\t\\leftrightharpoons\n1\t\\rightleftharpoons\n1\t\\nLeftarrow\n1\t\\nLeftrightarrow\n1\t\\nRightarrow\n1\t\\Leftarrow\n1\t\\Uparrow\n2\t\\Downarrow\n1\t\\Leftrightarrow\n1\t\\Updownarrow\n1\t\\nwarrow\n1\t\\nearrow\n1\t\\searrow\n1\t\\swarrow\n1\t\\Lleftarrow\n1\t\\Rrightarrow\n1\t\\leftarrow\n1\t\\rightsquigarrow\n1\t\\uparrow\n1\t\\downarrow\n1\t\\leftarrow\n1\t\\uparrow\n1\t\\rightarrow\n1\t\\downarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\Leftarrow\n1\t\\Uparrow\n1\t\\Rightarrow\n1\t\\Downarrow\n1\t\\Uparrow\n1\t\\Uparrow\n1\t\\Uparrow\n1\t\\Uparrow\n1\t\\Uparrow\n1\t\\Uparrow\n1\t\\Leftarrow\n1\t\\nwarrow\n1\t\\searrow\n1\t\\Updownarrow\n1\t\\rightarrow\n1\t\n1\t\\Rrightarrow\n1\t\\nleftarrow\n1\t\\nrightarrow\n1\t\\nleftrightarrow\n1\t\\nleftarrow\n1\t\\nrightarrow\n1\t\\nleftrightarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\leftrightarrow\n2\tC\n3\t\\nexists\n4\t\\in\n1\t\\notin\n1\t\\in\n1\t\\ni\n1\t\\not\\in\n1\t\\ni\n1\t\\square\n2\t\\coprod\n2\t-\n1\t+-\n1\t\\dot{+}\n1\t/\n1\t\\backslash\n1\t*\n1\t\\circ\n3\t\\sqrt[3]{}\n1\t\\sqrt[4]{}\n1\t\\propto\n2\t\\llcorner\n2\t\\measuredangle\n1\t\\measuredangle\n2\t\\not|\n2\t\\not\\parallel\n1\t\\land\n1\t\\lor\n4\t\\iint\n1\t\\iiint\n2\t\\oiint\n1\t\\oiint\n1\t\\int\n1\t\\oint\n1\t\\oint\n1\t\\therefore \n2\t:\n1\t::\n1\t\\bot\n1\t-:\n1\t:-:\n1\t\\sim\n1\t\\sim\n1\t\\sim\n1\t\\infty\n1\t\\sim\n1\t\n1\t\\not\\sim\n1\t=\n1\t\\simeq\n1\t\\not\\simeq\n1\t\\cong\n1\t\\ncong\n1\t\\ncong\n2\t\\approx /\n1\t\\approx\n1\t\\approx\n1\t\\approx\n1\t\\asymp\n1\t\n1\t\n1\t\\doteq\n1\t\\doteq\n1\t\\doteq\n1\t\\doteq\n1\t:=\n1\t=:\n1\t=\n1\t\\doteq\n1\t=\n1\t\\triangleq\n1\t\\triangleq\n1\t\\doteq\n1\t\\triangleq\n1\t\\overset{def}{=}\n1\t\\overset{m}{=} \n1\t\\doteq\n2\t\\equiv\n1\t\\equiv /\n1\t\\overset{=}{=} \n2\t\\geq\n1\t\\leq\n1\t\\geqq\n1\t\\nleqslant\n1\t\\ngeqslant\n1\t\\ll\n1\t\\gg\n1\t\n1\t\\neq\n1\t</\n1\t>/\n1\t\\leq/\n1\t\\geq/\n1\t\\leq\n1\t\\geg\n1\t\\not\\leq\n1\t\\not\\geg\n1\t\\overset{<}{>}\n1\t\\overset{>}{<}\n1\t\\not\\overset{>}{<}\n1\t\\not\\overset{>}{<}\n1\t\\prec\n1\t\\succ\n1\t\\preceq\n1\t\\succeq\n1\t\\precsim\n1\t\\succsim\n1\t\\preceq\n1\t\\nsucc\n1\t\\subset\n1\t\\supset\n1\t\\not\\subset\n1\t\\not\\supset\n1\t\\subseteq\n1\t\\supseteq\n1\t\\nsubseteq\n1\t\\nsupseteq\n1\t\\subsetneq\n1\t\\supsetneq\n1\t\\cup\n1\t\\cup\n1\t\\cup\n1\t\\sqsubset\n1\t\\sqsupset\n1\t\\sqsubseteq\n1\t\\sqsupseteq\n1\t\\sqcap\n1\t\\sqcup\n1\t\\oplus\n1\t\\ominus\n1\t\\bigotimes\n1\t\\oslash\n2\t\\odot\n1\t\\odot\n1\t\\ominus\n1\t\\ominus\n1\t\\boxplus\n1\t\\boxminus\n1\t\\boxtimes\n1\t\\boxdot\n1\t\\vdash\n1\t\\dashv\n2\t\\bot\n1\t\\vdash\n1\t\\models\n1\t\\vDash\n1\t\\Vdash\n1\t|\\models\n1\t|\\models\n1\t\\nvDash\n1\t\\nvDash\n1\t\\cancel{\\Vdash}\n1\t\\cancel{\\vDash}\n1\t\\prec\n1\t\\succ\n1\t\\triangleleft\n1\t\\triangleright\n2\t\\triangleright\n1\t\\circ\\multimap\n1\t\\circ\\multimap\n1\t\\rightarrow\n1\t\n1\t\\top\n1\t\\underline{\\lor}\n1\t\\overline{\\land}\n1\t\\overline{\\lor}\n1\t\\measuredangle\n1\t\\triangle\n8\t\\ast\n1\t\\Join\n1\t\\rtimes\n1\t\\ltimes\n1\t\\bowtie\n1\t\n1\t\\simeq\n1\t\\vee\n1\t\\wedge\n1\t\\subset\n1\t\\supset\n1\t\\cap\n1\t\\cup\n1\t\\pitchfork\n1\t\\#\n1\t<*\n1\t*>\n1\t\\lll\n1\t\\ggg\n1\t\\underset{<}{\\geq}\n1\t\\underset{>}{\\leq}\n1\t\\overline{<}\n1\t\\overline{>}\n1\t\\prec\n1\t\\succ\n1\t\\nprec\n1\t\\nsucc\n1\t\\not\\sqsubseteq\n1\t\\not\\sqsupseteq\n1\t\\not\\sqsubseteq\n1\t\\not\\sqsupseteq\n1\t\\underset{\\not\\sim}{<}\n1\t\\underset{\\not\\sim}{>}\n1\t\\underset{\\sim}{\\prec}\n1\t\\underset{\\sim}{\\succ}\n1\t\\not\\triangleleft\n1\t\\not\\triangleright\n1\t\\not\\triangleleft\n1\t\\not\\triangleright\n2\t\\hdots\n1\t\\ddots\n2\t\\in\n1\t\\in\n1\t\\in\n1\t\\dot{\\in}\n1\t\\overline{\\in}\n1\t\\overline{\\in}\n1\t\\underline{\\in}\n1\t\\underline{\\in}\n1\t\\in\n1\t\\in\n1\t\\in\n1\t\\overline{\\ni}\n1\t\\overline{\\ni}\n1\t\\Epsilon\n51\t\\overbrace\n1\t\\underbrace\n6\t-\nx\t\\overbrace\n1\t\\underbrace\n1\t\\overbrace\n1\t\\underbrace\n1\t\\overbrace\n1\t\\underbrace\ncf\t\\blacksquare\na\t\\square\n3\t\\square\n1\t\\blacksquare\n1\t\\square\n1\t\\blacksquare\n2\t\\bigtriangleup\n2\t\\triangle\n1\t\\triangle\n1\t\\triangleright\n1\t\\triangleright\n1\t\\triangleright\n1\t\\triangleright\n3\t\\triangledown\n1\t\\triangledown\n1\t\\triangledown\n1\t\\triangledown\n1\t\\triangleleft\n1\t\\triangleleft\n1\t\\triangleleft\n1\t\\triangleleft\n1\t\\triangleleft\n1\t\\triangleleft\n1\t\\diamond\n1\t\\diamond\n1\t\\diamond\n1\t\\circledcirc\n3\t\\circledcirc\n1\t\\circledcirc\n1\t\\circledcirc\n8\t\\circle\n1\t\\circle\nf\t\\circle\nl\t\\Box\n36\t\n1\t\n1\t\\#\n6h\t\\mid\nq\t\\left(\\right.\n1\t\\left.\\right)\n1a\t\\rightarrow\n1x\t\\(|\n1\t\\)|\n3\t\\ll\n1\t\\gg\n1\t\\left[[ \\right.\n1\t\\left. \\right]]\n1\t\\left[ \\right.\n1\t\\left. \\right]\n1\t\\Uparrow\n1\t\\Downarrow\n4\t\\leftarrow\n1\t\\rightarrow\n1\t\\leftrightarrow\n1\t\\Longleftarrow\n1\t\\Longrightarrow\n1\t\\Longleftrightarrow\n1\t\\leftarrow\n1\t\\mapsto\n1\t\\Leftarrow\n1\t\\Rightarrow\n1\t\\rightsquigarrow\n75\t\\rightsquigarrow\n1\t\\rightsquigarrow\n1\t\\nLeftarrow\n1\t\\nRightarrow\n1\t\\nLeftrightarrow\n1\t\\mapsto\n1\t\\Leftarrow\n1\t\\Rightarrow\n1\t\\downarrow\n1\t\\uparrow\n1\t\\Uparrow\n1\t\\Downarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\rightarrow\n1\t\\rightarrow\n1\t\\uparrow\n1\t\\downarrow\n1\t\\rightarrow\n1\t\\rightarrow\n1\t\\rightarrow\n1\t\\rightarrow\n1\t\\rightarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\leftarrow\n1\t\\rightarrow\\cdot\n1\t\\cdot\\leftarrow\n1\t\\mapsto\\cdot\n1\t \n1\t \n1\t \n1\t \n1\t \n1\t \n1\t \n1\t \n1\t \n1\t \n1\t\\times\n1\t\\times\n1\t \n1\t \n1\t \n1\t \n1\t \n1\t\\leftarrow\n8\t\\leftarrow\n1\t\\rightarrow\n1\t\\rightarrow\n1\t\\leftarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\circlearrowleft\n1\t\\circlearrowright\n1\t\\rightleftarrows\n1\t\\leftrightarrows\n1\t\\rightleftarrows\n1\t\n1\t\n1\t\\nrightarrow\n1\t\\leftrightarrow\n1\t\n1\t\\leftrightarrow\n1\t\\leftrightarrow\n1\t\\updownarrow\n1\t\\updownarrow\n1\t\\leftrightarrow\n1\t\\updownarrow\n1\t\\leftrightarrow\n1\t\\updownarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\uparrow\n1\t\\downarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\uparrow\n1\t\\downarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\uparrow\n1\t\\downarrow\n1\t\\leftarrow\n1\t\\rightarrow\n1\t\\uparrow\n1\t\\downarrow\n1\t\\Leftarrow\n1\t\\Uparrow\n1\t\\Rightarrow\n1\t\\Downarrow\n1\t\\rightleftharpoons\n1\t\\rightleftharpoons\n1\t\\rightleftharpoons\n1\t\\rightleftharpoons\n1\t\\underline{\\leftharpoonup}\n1\t\\overline{\\leftharpoondown}\n1\t\\underline{\\rightharpoonup}\n1\t\\overline{\\rightharpoondown}\n1\t\n1\t\n1\t\n1\t\\overset{=}{\\rightarrow}\n1\t\\overset{\\sim}{\\rightarrow}\n1\t\\underset{\\sim}{\\leftarrow}\n1\t\\underset{\\sim}{\\rightarrow}\n1\t\\underset{\\approx}{\\rightarrow}\n1\t\\underset{\\leftarrow}{<}\n1\t\n1\t\\underset{\\rightarrow}{>}\n1\t\\underset{\\rightarrow}{\\subset}\n1\t\n1\t\\underset{\\rightarrow}{\\supset}\n1\t\\succ\n1\t\\prec\n1\t\n1\t\n1\t\\||\n2\t:\n1\t\\{|\n1\t|\\}\n1\t\\(\\(\n1\t|\\)\n1\t\\(|\n1\t|\\)\n1\t\\triangleleft\n1\t\\triangleright\n1\t\\]\n1\t\\[\n1\t\\[\n1\t\\]\n1\t\\]\n1\t\\]\n1\t\\ll\n1\t\\gg\n1\t\\ll\n1\t\\gg\n1\t\\gg\n1\t\\ll\n1\t\\[\n1\t\\]\n1\t\\vdots\n1\t\n1\t\\measuredangle\n1\t\\perp\n1\t\\measuredangle\n1\t\\measuredangle\n1\t\\angle\n1\t\\bcancel{>}\n1\t\\not\\lor\n2\t\\ulcorner\n1\t\n1\t\n1\t\n1\t\n1\t\\measuredangle\n7\t\\measuredangle\n1\t\\varnothing\n1\t\\overline{\\varnothing}\n1\t\\dot{\\varnothing}\n1\t\\vec{\\varnothing}\n1\t\\vec{\\varnothing}\n2\t\\ominus\n1\t\\ominus\n1\t\\varnothing\n1\t\\varnothing\n1\t\n1\t\\otimes\n1\t\\oplus\n1\t\\varnothing\n1\t\\odot\n1\t\\odot\n1\t\\circle\n1\t\\circle\n1\t\\odot\n1\t\\odot\n1\t\\cancel{\\square}\n1\t\\bcancel{\\square}\n1\t\\boxed{\\rightarrow}\n1\t\\boxed{\\circ}\n1\t\\boxed{\\circ}\n1\t\n1\t\\dot{\\triangle}\n1\t\\underline{\\triangle}\n1\t\n1\t\\triangle\n1\t\n1\t\\triangleleft |\n1\t| \\triangleright\n1\t\\bowtie\n1\t\\bowtie\n1\t\\bowtie\n1\t\\bowtie\n1\t\\bowtie\n1\t\n1\t\n1\t\\}\n1\t\\{\n2\t\\{\\{\n1\t\n1\t\n1\t\n1\t\\bullet-\\bullet\n1\t\\square\n1\t\n1\t\\sqcup\\sqcup\n1\t\\neq\n1\t\\approx\\neq\n1\t\\not\\equiv\n1\t\\models\n1\t\\ddagger\n1\t\n1\t\n1\t\n1\t\\lozenge\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\\Phi\n1\t\\Phi\n1\t:\\rightarrow\n1\t\\backslash\n1\t\n1\thcancel{\backslash}\n2\t\\backslash\n1\t\\hcancel{||}\n1\t\\hcancel{|||}\n1\t\\{\n1\t\\}\n1\t+\n1\t\n1\t\\odot\n1\t\\oplus\n1\t\\otimes\n1\t\\cup\n1\t\\uplus\n1\t\\sqcap\n1\t\\sqcup\n1\t\n1\t\n1\t\\times\n1\t\n1\t\n1\t\\iiiint\n1\t\\hcancel{\\int}\n1\t\n1\t\\bcancel{\\int}\n1\t\\int\n1\t\\int\n1\t\\int\n1\t\\int\n1\t\\int\n1\t\\oint\n1\t\\oint\n1\t\\int\n1\t\\int\n1\t\\int\n1\t\\int\n1\t\\overline{\\int}\n1\t\\underline{\\int}\n1\t\\bowtie\n1\t\\triangleleft\n1\t\n1\t>>\n1\t\\upharpoonright\n1\t\\dot{+}\n1\t\\hat{+}\n1\t\\overset{\\sim}{+}\n1\t\\underset{\\circ}{+}\n1\t\\underset{\\sim}{+}\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\\bigodot\n1\t\\bigodot\n1\t\\times\n1\t\\dot{\\times}\n1\t\\underline{\\times}\n1\t\\underline{\\times}\n1\t\n1\t\n1\t\n1\t\\hat{\\otimes}\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\\lrcorner\n1\t\\llcorner\n1\t\n1\t\\coprod\n1\t\n1\t\n1\t\\overline{\\cup}\n1\t\\overline{\\cap}\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\\overline{\\cup}\n1\t\\overline{\\cap}\n1\t\n1\t\n1\t\n1\t\\dot{\\wedge}\n1\t\\dot{\\vee}\n1\t\n1\t\n1\t\n1\t\n1\t\\wedge\n1\t\\vee\n1\t\n1\t\n1\t\n1\t\\hcancel{\\wedge}\n1\t\\hcancel{\\vee}\n1\t\\overset{=}{\\wedge}\n1\t\\underline{\\wedge}\n1\t\\underset{=}{\\wedge}\n1\tul(vv)\n1\t\\overset{=}{\\vee}\n1\t\\underset{=}{\\vee}\n1\t\n1\t\n1\t\\underset{\\cdot}{=}\n1\t\\dot{\\equiv}\n1\t\n1\t\n1\t\\dot{\\sim}\n1\t\n1\t\n1\t\\dot{\\approx}\n1\t\\overset{*}{=}\n1\t\\overset{\\wedge}{=}\n1\t\\overset{\\approx}{=}\n1\t\\overset{=}{+}\n1\t\\underset{=}{+}\n1\t\n1\t::=\n1\t==\n1\t===\n1\t\n1\t\\overset{\\dots}{\\equiv}\n1\t\n1\t\n1\t\n1\t\n1\t\\leq\n1\t\\geq\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\\underset{\\approx}{<}\n1\t\\underset{\\approx}{>}\n1\t\\nleqslant\n1\t\\ngeqslant\n1\t\\underset{\\approx}{<}\n1\t\\underset{\\cancel{\\approx}}{>}\n1\t\\lesseqqgtr\n1\t\\gtreqqless\n1\t\\underset{\\simeq}{<}\n1\t\\underset{\\simeq}{>}\n1\t\\underset{>}{\\lesssim}\n1\t\\underset{<}{\\gtrsim}\n1\t\\underset{=}{\\lessgtr}\n1\t\\underset{=}{\\gtrless}\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\\overset{=}{<}\n1\t\\overset{=}{>}\n1\t\n1\t\n1\t\\overset{\\sim}{<}\n1\t\\overset{\\sim}{>}\n1\t\\overset{\\sim}{\\leqq}\n1\t\\overset{\\sim}{\\geqq}\n1\t\\ll\n1\t\\gg\n1\t\\underline{\\ll}\n1\t><\n1\t><\n1\t\\vartriangleleft\n1\t\\vartriangleright\n1\t\n1\t\n1\t\\hcancel{<}\n1\t\\hcancel{>}\n1\t\\underline{\\hcancel{>}}\n1\t\\underline{\\hcancel{>}}\n1\t\n1\t\\preceq\n1\t\\succeq\n1\t\n1\t\n1\t\\underset{=}{\\prec}\n1\t\\underset{=}{\\succ}\n1\t\\underset{\\cancel{=}}{\\prec}\n1\t\\underset{\\cancel{=}}{\\succ}\n1\t\\underset{\\approx}{\\prec}\n1\t\\underset{\\approx}{\\succ}\n1\t\\underset{\\cancel{\\approx}}{\\prec}\n1\t\\underset{\\cancel{\\approx}}{\\succ}\n1\t\\ll\n1\t\\gg \n1\t\n1\t\n1\t\\underset{+}{\\subset}\n1\t\\underset{+}{\\supset}\n1\t\\underset{\\times}{\\subset}\n1\t\\underset{\\times}{\\supset}\n1\t\\dot{\\subseteq}\n1\t\\dot{\\supseteq}\n1\t\\subseteqq\n1\t\\supseteqq\n1\t\\underset{\\sim}{\\subset}\n1\t\\underset{\\sim}{\\supset}\n1\t\\underset{\\approx}{\\subset}\n1\t\\underset{\\approx}{\\supset}\n1\t\\underset{\\neq}{\\subset}\n1\t\\underset{\\neq}{\\supset}\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\\pitchfork\n2\t\n1\t\\dashv\n1\t\\top\n1\t\\perp\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\\overline{\\top}\n1\t\\underline{\\perp}\n1\t\n1\t\n1\t\n1\t\n1\t\n1\t\\bcancel{\\mid}\n1\t\n1\t\n1\t\n1\t\\nparallel\n1\t\n1\t\n1\t\n1\t\\vdots\n1\t\n1\t\n1\t\n1\t\n1\t///\n1\t\\mid\\mid\\mid\n1\t//\n1\t\n1\t\n6\t\\leftarrow\n1\t\\uparrow\n1\t\\downarrow\n1q\t\\Lleftarrow\n1\t\\Rrightarrow\n27\t\\rightarrow\nw2\t\\)|";
const SYM_ONLY_DATA = "w\t\\textrm{ }\n2k\t\\mid\n12\t\\cent\ng\t^{2}\n3\t\\mu\n16\t\\ss\n2a\t\\imath\n2n\t\\varepsilon\n2\tf\nf\to\n56\t\\varepsilon\n8\t\\gamma\na\t\\ell\n6\t\\eta\n2\t\\theta\n3\t\\phi\nj\t\\upsilon\n1n\t\\hat{}\n5x\t\\Lambda\n2\t\\nu\n1\t\\Xi\n7\tY\ng\t\\epsilon\n9\t\\xi\n1\to\ni\t\\vartheta\nz\t\\theta\ng\t\\epsilon\n7\t\\hbar\nj\t0\n6\t\\Phi\nc\ta\nf\t\\pi\n1\tp\n5\tx\nf\t\\epsilon\n7\t\\hbar\n4b\t\\Gamma\n2l\t\\Phi\nr5\t \nzh\t\\mathbf{m}\n10n\t \n261\tm\n3i\t\\hat{e}\n9b\t\\text{\\textdir LTR}\nu\t\\text{\\textdir TRT}\n6k\t\\wp\nt\t\\aleph\n3\t\\wp\nd\t\\_{D}\n3\ti\n3w\t\\iff\n1m\t\\blacksquare\n9\t\\star\n1\t@\n9\t\\angle\n6\t\\wedge\n1\t\\vee\nc\t\\therefore\n2p\to+\n2\t\\bigoplus\n14\t\\bigtriangleup\n9\t\\bowtie\n1\t\\ltimes\n1\t\\rtimes\n2g\t\\frown\n22\t\\theta\n8\t\\rho\n1\t\\omega\n1y\t\\overline\n4l\t\\textcircled{1}\n1\t\\textcircled{2}\n1\t\\textcircled{3}\n1\t\\textcircled{4}\n1\t\\textcircled{5}\n1\t\\textcircled{6}\n1\t\\textcircled{7}\n1\t\\textcircled{8}\n1\t\\textcircled{9}\n1\t\\textcircled{10}\n1\t\\textcircled{11}\n1\t\\textcircled{12}\n1\t\\textcircled{13}\n1\t\\textcircled{14}\n1\t\\textcircled{15}\n1\t\\textcircled{16}\n1\t\\textcircled{17}\n1\t\\textcircled{18}\n1\t\\textcircled{19}\n1\t\\textcircled{20}\n3b\t\\textcircled{0}\naj\t\\heartsuit\nap\t\\llbracket\nci\t\\llbracket\n18p\t \n12\t\\rangle\nfu\t\\textcircled{21}\n1\t\\textcircled{22}\n1\t\\textcircled{23}\n1\t\\textcircled{24}\n1\t\\textcircled{25}\n1\t\\textcircled{26}\n1\t\\textcircled{27}\n1\t\\textcircled{28}\n1\t\\textcircled{29}\n1\t\\textcircled{30}\n1\t\\textcircled{31}\n1\t\\textcircled{32}\n1\t\\textcircled{33}\n1\t\\textcircled{34}\n1\t\\textcircled{35}\n2a\t\\textcircled{36}\n1\t\\textcircled{37}\n1\t\\textcircled{38}\n1\t\\textcircled{39}\n1\t\\textcircled{40}\n1\t\\textcircled{41}\n1\t\\textcircled{42}\n1\t\\textcircled{43}\n1\t\\textcircled{44}\n1\t\\textcircled{45}\n1\t\\textcircled{46}\n1\t\\textcircled{47}\n1\t\\textcircled{48}\n1\t\\textcircled{49}\n1\t\\textcircled{50}\nddq\t \ninn\t \n1efy\ta\n1\tb\n1\tc\n1\td\n1\te\n1\tf\n1\tg\n2\ti\n1\tj\n1\tk\n1\tl\n1\tm\n1\tn\n1\to\n1\tp\n1\tq\n1\tr\n1\ts\n1\tt\n1\tu\n1\tv\n1\tw\n1\tx\n1\ty\n1\tz\n2u\tx\n1\ty\n1\tz\n1d\tw\nbj\tv\n1s\t\\varphi\nu\t\\beta\n3\t\\epsilon\n6\t\\lambda\n5\t\\pi\n6\t\\varphi\n2\t\\psi\n5be\tx";
const VOWELS_DATA = "5c\t\\grave{A}\n1\t\\acute{A}\n1\t\\hat{A}\n1\t\\tilde{A}\n1\t\\ddot{A}\n1\t\\mathring{A}\n2\t\\dot{C}\n1\t\\grave{E}\n1\t\\acute{E}\n1\t\\hat{E}\n1\t\\ddot{E}\n1\t\\grave{I}\n1\t\\acute{I}\n1\t\\hat{I}\n1\t\\ddot{I}\n2\t\\tilde{N}\n1\t\\grave{O}\n1\t\\acute{O}\n1\t\\hat{O}\n1\t\\tilde{O}\n1\t\\ddot{O}\n3\t\\grave{U}\n1\t\\acute{U}\n1\t\\hat{U}\n1\t\\ddot{U}\n1\t\\acute{Y}\n3\t\\grave{a}\n1\t\\acute{a}\n1\t\\hat{a}\n1\t\\tilde{a}\n1\t\\ddot{a}\n1\t\\mathring{a}\n2\t\\dot{c}\n1\t\\grave{e}\n1\t\\acute{e}\n1\t\\hat{e}\n1\t\\ddot{e}\n1\t\\grave{i}\n1\t\\acute{i}\n1\t\\hat{i}\n1\t\\ddot{i}\n2\t\\tilde{n}\n1\t\\grave{o}\n1\t\\acute{o}\n1\t\\hat{o}\n1\t\\tilde{o}\n1\t\\ddot{o}\n3\t\\grave{u}\n1\t\\acute{u}\n1\t\\hat{u}\n1\t\\ddot{u}\n1\t\\acute{y}\n2\t\\ddot{y}\n1\t\\bar{A}\n1\t\\bar{a}\n1\t\\breve{A}\n1\t\\breve{a}\n2\t\\dot{a}\nd\t\\bar{E}\n1\t\\bar{e}\n3\t\\dot{E}\n3\t\\dot{e}\n1\t\\check{E}\n1\t\\check{e}\nf\t\\bar{I}\n1\t\\bar{i}\n1\t\\breve{I}\n3\t\\dot{i}\n5\t\\hat{J}\n1\t\\hat{j}\nn\t\\bar{O}\n1\t\\bar{o}\n3\t\\H{O}\n1\t\\H{o}\np\t\\bar{U}\n1\t\\bar{u}\n5\t\\H{U}\n1\t\\H{u}\n5\t\\hat{Y}\n1\t\\hat{y}\n1\t\\ddot{Y}\n1\t\\acute{Z}\n1\t\\acute{z}\n1\t\\hat{Z}\n1\t\\hat{z}\n1\t\\check{Z}\n1\t\\check{z}\n27\t\\check{A}\n1\t\\check{a}\n1\t\\check{I}\n1\t\\check{i}\n1\t\\check{O}\n1\t\\check{o}\n1\t\\check{U}\n1\t\\check{u}\n1\t\\ddot{U}\n1\t\\ddot{u}\n2\t\\ddot{u}\n2\t\\ddot{u}\n2\t\\ddot{u}\n2\t\\H{A}\n1\t\\hat{a}\n1\t\\bar{A}\n1\t\\bar{a}\np\t\\mathring{A}\n1\t\\dot{a}\n9\t\\grave{E}\n2\t\\ddot{E}\n1\t\\hat{i}\n1\t\\grave{I}\n1\t\\grave{i}\n1\t\\ddot{I}\n1\t\\ddot{i}\n1\t\\grave{O}\n1\t\\grave{o}\n1\t\\ddot{O}\n1\t\\ddot{o}\n5\t\\grave{U}\n1\t\\grave{u}\n1\t\\ddot{U}\n1\t\\ddot{u}\nf\t\\dot{A}\n4\t\\breve{O}\n1\t\\breve{o}\n1\t\\H{O}\n1\t\\H{o}\n1\t\\dot{O}\n1\t\\dot{o}\n3\t\\bar{Y}\n1\t\\bar{y}\nf2\t\\ddot{e}\n563\t\\tilde{V}\n1\t\\tilde{v}\nk\t\\hat{z}\n2p\t\\grave{Y}\n1\t\\grave{y}\nfs\t\\mathring{A}";

const MULTI_OP: Record<string, string> = {"**":"\\star\\star","|||":"\\left|||\\right.","||":"\\left\\|\\right.","\u2add\u0338":"","\u2aa2\u0338":"\\cancel{\\gg}","\u2aa1\u0338":"\\cancel{\\ll}","\u2a7e\u0338":"\\bcancel{\\geq}","\u2a7d\u0338":"\\bcancel{\\leq}","\u29d0\u0338":"| \\not\\triangleright","\u29cf\u0338":"\\not\\triangleleft |","\u2290\u0338":"\\not\\sqsupset","\u228f\u0338":"\\not\\sqsubset","\u227f\u0338":"\\not\\succsim","\u2266\u0338":"\\not\\leq","\u224f\u0338":"","\u224e\u0338":"","\u2242\u0338":"\\neq","\u223d\u0331":"\\sim","\u2ab0\u0338":"\\nsucceq","\u2aaf\u0338":"\\npreceq","\\triangleleft":"","\u226b\u0338":"\\not\\gg","\u226a\u0338":"\\not\\ll","/=":"=","\u2283\u20d2":"\\supset |","\u2282\u20d2":"\\subset |","&&":"\\&\\&","...":"\\cdots"};
const MULTI_SYM: Record<string, string> = {"\u219b'":"\\nrightarrow"};

const VULGAR_FRACTIONS: Record<string, string> = {
	'\u00BD': '1/2', '\u2153': '1/3', '\u2154': '2/3',
	'\u00BC': '1/4', '\u00BE': '3/4', '\u2155': '1/5',
	'\u2156': '2/5', '\u2157': '3/5', '\u2158': '4/5',
	'\u2159': '1/6', '\u215A': '5/6', '\u2150': '1/7',
	'\u215B': '1/8', '\u215C': '3/8', '\u215D': '5/8',
	'\u215E': '7/8', '\u2151': '1/9', '\u2152': '1/10',
};

const LETTERLIKE_FONTS: Record<string, string> = {
	'\u2102': '\\mathbb{C}', '\u210D': '\\mathbb{H}', '\u2115': '\\mathbb{N}',
	'\u2119': '\\mathbb{P}', '\u211A': '\\mathbb{Q}', '\u211D': '\\mathbb{R}',
	'\u2124': '\\mathbb{Z}', '\u212C': '\\mathcal{B}', '\u2130': '\\mathcal{E}',
	'\u2131': '\\mathcal{F}', '\u210B': '\\mathcal{H}', '\u2110': '\\mathcal{I}',
	'\u2112': '\\mathcal{L}', '\u2133': '\\mathcal{M}', '\u211B': '\\mathcal{R}',
	'\u211F': '\\mathcal{R}', '\u212D': '\\mathfrak{C}', '\u210C': '\\mathfrak{H}',
	'\u2111': '\\mathfrak{I}', '\u211C': '\\mathfrak{R}', '\u2128': '\\mathfrak{Z}',
	'\u0237': '\\mathsf{J}', '\uD835\uDD7D': '\\mathcal{R}', '\uD835\uDF86': '\\mathbf{X}',
};

const BOLD_GREEK_UPPER = [
	'A', 'B', '\\Gamma', '\\Delta', 'E', 'Z', 'H', '\\Theta',
	'I', 'K', '\\Lambda', 'M', 'N', '\\Xi', 'O', '\\Pi',
	'P', '\\Theta', '\\Sigma', 'T', '\\Upsilon', '\\Phi', 'X', '\\Psi', '\\Omega',
];

let opMap: Map<string, string> | null = null;
let symMap: Map<string, string> | null = null;
let vowelMap: Map<string, string> | null = null;

function decodeDeltaTable(data: string, target: Map<string, string>): void {
	let cp = 0;
	let start = 0;
	const len = data.length;
	while (start < len) {
		let end = data.indexOf('\n', start);
		if (end === -1) end = len;
		const tab = data.indexOf('\t', start);
		if (tab !== -1 && tab < end) {
			cp += parseInt(data.slice(start, tab), 36);
			target.set(String.fromCodePoint(cp), data.slice(tab + 1, end));
		}
		start = end + 1;
	}
}

function ensureTables(): void {
	if (opMap !== null) return;
	const shared = new Map<string, string>();
	decodeDeltaTable(SHARED_DATA, shared);

	opMap = new Map(shared);
	decodeDeltaTable(OP_ONLY_DATA, opMap);
	for (const k of Object.keys(MULTI_OP)) opMap.set(k, MULTI_OP[k]);

	symMap = new Map(shared);
	decodeDeltaTable(SYM_ONLY_DATA, symMap);
	for (const k of Object.keys(MULTI_SYM)) symMap.set(k, MULTI_SYM[k]);

	vowelMap = new Map();
	decodeDeltaTable(VOWELS_DATA, vowelMap);
}

export function lookupMathNumber(value: string): string | undefined {
	if (value.length !== 1) return undefined;
	if (Object.prototype.hasOwnProperty.call(VULGAR_FRACTIONS, value)) {
		const frac = VULGAR_FRACTIONS[value];
		const slash = frac.indexOf('/');
		return `\\dfrac{${frac.slice(0, slash)}}{${frac.slice(slash + 1)}}`;
	}
	const cp = value.charCodeAt(0);
	if (cp >= 0x2080 && cp <= 0x2089) return `_{${cp - 0x2080}}`;
	if (cp === 0x2070) return '^{0}';
	if (cp === 0x00B9) return '^{1}';
	if (cp === 0x00B2) return '^{2}';
	if (cp === 0x00B3) return '^{3}';
	if (cp >= 0x2074 && cp <= 0x2079) return `^{${cp - 0x2070}}`;
	if (cp === 0x207F) return '^{n}';
	if (cp === 0x2099) return '_{n}';
	if (cp === 0x24EA) return '\\textcircled{0}';
	if (cp >= 0x2460 && cp <= 0x2473) return `\\textcircled{${cp - 0x245F}}`;
	if (cp >= 0x3251 && cp <= 0x325F) return `\\textcircled{${cp - 0x323C}}`;
	if (cp >= 0x32B1 && cp <= 0x32BF) return `\\textcircled{${cp - 0x328D}}`;
	return undefined;
}

export function convertUtf8Char(char: string): string {
	if (/[a-z0-9]/i.test(char)) return char;
	ensureTables();
	const vowel = vowelMap!.get(char);
	if (vowel !== undefined) return vowel;
	if (Object.prototype.hasOwnProperty.call(LETTERLIKE_FONTS, char)) {
		return LETTERLIKE_FONTS[char];
	}
	const cp = char.codePointAt(0);
	if (cp === undefined || char.length !== (cp > 0xFFFF ? 2 : 1)) return char;
	if (cp >= 0x1D400 && cp <= 0x1D419) return `\\mathbf{${String.fromCharCode(65 + cp - 0x1D400)}}`;
	if (cp >= 0x1D434 && cp <= 0x1D44D) return `\\mathit{${String.fromCharCode(65 + cp - 0x1D434)}}`;
	if (cp >= 0x1D49C && cp <= 0x1D4B5) return `\\mathcal{${String.fromCharCode(65 + cp - 0x1D49C)}}`;
	if (cp >= 0x1D4D0 && cp <= 0x1D4E9) return `\\mathcal{${String.fromCharCode(65 + cp - 0x1D4D0)}}`;
	if (cp >= 0x1D504 && cp <= 0x1D51C) return `\\mathfrak{${String.fromCharCode(65 + cp - 0x1D504)}}`;
	if (cp >= 0x1D538 && cp <= 0x1D550) return `\\mathbb{${String.fromCharCode(65 + cp - 0x1D538)}}`;
	if (cp >= 0x1D5A0 && cp <= 0x1D5B9) return `\\mathsf{${String.fromCharCode(65 + cp - 0x1D5A0)}}`;
	if (cp >= 0x1D670 && cp <= 0x1D689) return `\\mathtt{${String.fromCharCode(65 + cp - 0x1D670)}}`;
	if (cp >= 0x1D6A8 && cp <= 0x1D6C0) return `\\mathbf{${BOLD_GREEK_UPPER[cp - 0x1D6A8]}}`;
	if (cp >= 0x1D7CE && cp <= 0x1D7D7) return `\\mathbf{${cp - 0x1D7CE}}`;
	if (cp >= 0x1D7D8 && cp <= 0x1D7E1) return `\\mathbb{${cp - 0x1D7D8}}`;
	return char;
}

export function lookupSymbol(value: string): string {
	ensureTables();
	const found = symMap!.get(value);
	if (found !== undefined) return found;
	const num = lookupMathNumber(value);
	if (num !== undefined) return num;
	return convertUtf8Char(value);
}

export function lookupOperator(value: string): string {
	ensureTables();
	const found = opMap!.get(value);
	if (found !== undefined) return found;
	const num = lookupMathNumber(value);
	if (num !== undefined) return num;
	return convertUtf8Char(value);
}
