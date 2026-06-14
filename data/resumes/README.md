# Resume Sources

Drop the two source files here when you are ready:

- `ai-resume.tex`
- `fullstack-resume.pdf`

Then run the chunker, for example:

```bash
pnpm chunk:resume -- --input data/resumes/ai-resume.tex --output data/chunks/ai-resume.json --resume-type ai
pnpm chunk:resume -- --input data/resumes/fullstack-resume.pdf --output data/chunks/fullstack-resume.json --resume-type fullstack
```

The first step is only chunking. Embeddings come after this.
