# Deploying Streamlit App with ML Dependencies on Heroku: Challenges & Solutions

This README documents the challenges encountered when deploying a complex Streamlit application with machine learning dependencies to Heroku and the attempted solutions.

## Application Overview

This Streamlit application incorporates multiple data processing, AI/ML, and vector database libraries, including:
- NLP/ML: sentence_transformers, huggingface_hub, transformers, torch, etc.
- Vector DBs: lancedb, pinecone, chromadb, etc.
- LLM frameworks: langchain (various modules), openai, groq, etc.
- Data retrieval: yfinance, arxiv, wikipedia, newspaper4k, etc.

## Deployment Challenges

### Challenge 1: Rust Dependencies

The `tantivy` package required Rust for compilation, but Rust was not available during the build process.

**Error message:**
```
Cargo, the Rust package manager, is not installed or is not on PATH.
This package requires Rust and Cargo to compile extensions.
```

#### Solution Attempted:
- Added the Rust buildpack `https://github.com/emk/heroku-buildpack-rust`
- Created appropriate Rust project structure with `Cargo.toml` and `src/main.rs`
- Ensured correct buildpack order (Rust before Python)

### Challenge 2: Rust Detection Issues

When the buildpacks were correctly ordered, various Rust detection issues occurred:

**Initial error:**
```
App not compatible with buildpack: https://github.com/emk/heroku-buildpack-rust
```

**After adding proper project structure:**
```
error: failed to parse manifest at `/tmp/build_f4a1d895/Cargo.toml`
Caused by:
  no targets specified in the manifest
```

**After fixing manifest:**
```
error: `rustc -vV` didn't have a line for `host:`, got:
```

#### Solution Attempted:
- Created proper Rust project structure with bin targets
- Tried installing Rust directly in `setup.sh`

### Challenge 3: Slug Size Limit Exceeded (Final Blocker)

After resolving Rust issues, the application hit Heroku's slug size limit:

**Error message:**
```
Compiled slug size: 3.2G is too large (max is 500M).
See: http://devcenter.heroku.com/articles/slug-size
Push failed
```

## File Structure Used

```
my-streamlit-app/
├── app.py                  # Main Streamlit application
├── requirements.txt        # Python dependencies (extensive)
├── setup.sh                # Streamlit config + Rust installation
├── Procfile                # Process type declaration
├── Cargo.toml              # Rust package manifest
└── src/
    └── main.rs             # Minimal Rust code
```

## Possible Solutions to Slug Size Issue

These strategies were identified but not implemented due to project constraints:

1. **Reduce Python dependencies**:
   - Remove duplicate packages (e.g., bs4 and beautifulsoup4)
   - Remove unnecessary packages automatically installed as dependencies
   - Use lighter alternatives where possible

2. **Use Heroku's Python runtime buildpack options**:
   - Pin specific versions of large packages already cached in the buildpack

3. **Alternative deployment strategies**:
   - Split the application into multiple smaller services
   - Use container-based deployment instead of buildpacks
   - Move to a platform with larger size limits (AWS, Google Cloud, Azure)

## Conclusion

The application successfully resolved the Rust dependency issues but could not be deployed on Heroku due to the 500MB slug size limit. The total compiled size of 3.2GB exceeds this limit by more than 6x.

For future deployments of large ML applications, container-based solutions (Docker) or platforms with higher resource limits should be considered from the beginning of the project.

## Notes for Future Deployments

1. **Plan for deployment constraints early in development**:
   - Be selective about which dependencies to include
   - Consider microservices architecture for larger applications

2. **Alternative platforms for ML applications**:
   - AWS Elastic Beanstalk
   - Google Cloud Run
   - Azure App Service
   - Digital Ocean App Platform
   - Render.com
   - Railway.app

3. **Consider serverless architecture**:
   - Split compute-intensive tasks into separate functions
   - Use cloud-managed AI/ML services instead of self-hosted libraries

4. **Docker-based deployment options**:
   - Heroku container registry
   - GitHub Container Registry + cloud platform
   - Kubernetes for complex deployments