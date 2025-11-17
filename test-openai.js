import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOpenAI() {
  try {
    console.log('🔍 Testing OpenAI API key...\n');

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('📡 Making test API call with GPT-5 (latest model)...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello! OpenAI API is working perfectly!" in a friendly way.'
        }
      ],
      max_completion_tokens: 50
    });

    const response = completion.choices[0].message.content;
    
    console.log('\n✅ SUCCESS! OpenAI API is working!\n');
    console.log('📝 Response from OpenAI:');
    console.log('━'.repeat(60));
    console.log(response);
    console.log('━'.repeat(60));
    console.log('\n📊 API Details:');
    console.log(`   Model: ${completion.model}`);
    console.log(`   Tokens used: ${completion.usage.total_tokens}`);
    console.log(`   Prompt tokens: ${completion.usage.prompt_tokens}`);
    console.log(`   Completion tokens: ${completion.usage.completion_tokens}`);
    
    return true;
  } catch (error) {
    console.error('\n❌ ERROR: OpenAI API test failed!\n');
    console.error('Error details:', error.message);
    
    if (error.status === 401) {
      console.error('\n🔑 Issue: Invalid API key');
      console.error('   Please check your OPENAI_API_KEY in .env file');
    } else if (error.status === 429) {
      console.error('\n⚠️  Issue: Rate limit exceeded or insufficient credits');
      console.error('   Please check your OpenAI account balance');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🌐 Issue: Network connection problem');
      console.error('   Please check your internet connection');
    }
    
    return false;
  }
}

// Run the test
testOpenAI()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
