# OpenAI API Integration Setup Guide

## Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-...`)
5. **Important**: Save it somewhere safe - you won't be able to see it again!

## Step 2: Install Required Packages

Navigate to the backend directory of your project:

```bash
cd backend
pip install -r requirements.txt
```

Or install the required packages individually:

```bash
pip install openai>=1.0.0 python-dotenv==1.0.0
```

## Step 3: Create .env File

Create a file named `.env` in the backend directory:

```bash
cd backend
touch .env
```

Open the `.env` file in your text editor and add your API key:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Note**: Replace `sk-your-actual-api-key-here` with your actual OpenAI API key.

## Step 4: Verify Setup

Start the backend server:

```bash
cd backend
python3 app.py
```

The backend will automatically load the API key when it starts. You should see:

```
OpenAI client initialized successfully
```

If you see this instead:

```
OpenAI API key not found. Set OPENAI_API_KEY environment variable to enable AI feedback.
```

Then the API key is not being loaded correctly. Check the troubleshooting section below.

## Alternative: Set Environment Variable Directly

If you don't want to use a `.env` file, you can set the environment variable directly:

### macOS/Linux:

In your terminal:
```bash
export OPENAI_API_KEY="sk-your-actual-api-key-here"
```

Or add it to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
echo 'export OPENAI_API_KEY="sk-your-actual-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

### Windows:

In Command Prompt:
```cmd
set OPENAI_API_KEY=sk-your-actual-api-key-here
```

In PowerShell:
```powershell
$env:OPENAI_API_KEY="sk-your-actual-api-key-here"
```

## Troubleshooting

### API Key Not Found
- Make sure the `.env` file is in the `backend` directory
- Make sure there are no spaces around the `=` sign
- Make sure the key starts with `sk-`
- Restart the backend server after adding the key

### Import Error
- Make sure you installed the openai package: `pip install openai`
- Make sure you're using Python 3.7 or higher
- Check your Python version: `python3 --version`

### Invalid API Key
- Check that you copied the entire key (they're quite long)
- Make sure the key hasn't been revoked
- Try generating a new key on the OpenAI platform

### Package Installation Issues
If you encounter permission errors when installing packages:
- Use a virtual environment (recommended)
- Or use `pip install --user` to install packages for your user only

## Security Best Practices

**IMPORTANT: Never commit your `.env` file to version control!**

The `.env` file should be listed in your `.gitignore` file. To verify:

```bash
cat .gitignore | grep .env
```

If it's not there, add it:

```bash
echo ".env" >> .gitignore
```

## Cost Considerations

- OpenAI API calls are charged based on usage
- GPT-4o is more expensive than GPT-3.5-turbo
- Monitor your usage at: https://platform.openai.com/usage
- Set usage limits at: https://platform.openai.com/account/billing/limits
- Consider starting with GPT-3.5-turbo for testing (cheaper and faster)

## Current Implementation

The OpenAI integration is implemented in `validate_pose.py` and is optional. The application will work without it, but users won't receive AI-enhanced feedback. When configured:

- The app uses GPT-4o for generating personalized coaching feedback
- Feedback includes actionable cues, explanations, and encouragement
- Responses are structured as JSON for consistent parsing
- The integration gracefully handles errors and falls back to basic metrics

## Model Configuration

By default, the app uses `gpt-4o`. You can change this in `validate_pose.py`:

```python
response = client.chat.completions.create(
    model="gpt-4o",  # Change to "gpt-3.5-turbo" for lower cost
    messages=messages,
    temperature=0.7,
    max_tokens=500,
    response_format={"type": "json_object"}
)
```

### Model Recommendations:
- **gpt-4o**: Best quality, supports JSON mode, moderate cost
- **gpt-3.5-turbo**: Faster and cheaper, good for testing
- **gpt-4-turbo**: High quality, supports JSON mode, higher cost

## Testing Your Setup

You can test the integration from the command line:

```bash
cd backend
python3 -c "from validate_pose import client; print('Success!' if client else 'Not configured')"
```

If you see "Success!", your OpenAI client is properly configured.

## Need Help?

- OpenAI Documentation: https://platform.openai.com/docs
- API Reference: https://platform.openai.com/docs/api-reference
- Community Forum: https://community.openai.com
