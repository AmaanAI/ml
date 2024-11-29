import streamlit as st
from groq import Groq

# Initialize the Groq client
client = Groq(api_key='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')

# Title for the Streamlit app
st.title("AI-Powered Q&A Bot")

# Input section: Accept question either via URL query or user input
query_params = st.query_params  # Updated to st.query_params
question = query_params.get("question", [""])[0] if "question" in query_params else ""

if not question:
    # Allow users to input a question in the Streamlit interface
    question = st.text_input("Ask me a question:")

# Button to trigger the bot
if question:
    st.write(f"**Question:** {question}")

    with st.spinner("Thinking..."):
        try:
            # Generate a response using the Groq client
            completion = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {
                        "role": "assistant",
                        "content": "You are a helpful assistant that reads the question below and responds with the accurate answer."
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ],
                temperature=1,
                max_tokens=1024,
                top_p=1,
                stream=True,
                stop=None,
            )

            # Stream and display the response dynamically
            response = ""
            for chunk in completion:
                delta = chunk.choices[0].delta.content or ""
                response += delta
                st.write(delta)


            st.success("Done!")
        except Exception as e:
            st.error(f"An error occurred: {e}")

