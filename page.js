'use client'

import { Box, Button, Stack, TextField, Typography, Paper } from '@mui/material'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I can help you with all things sports. How can I help you today?",
    },
  ])
  const [message, setMessage] = useState('')

  const sendMessage = async () => {
    if (!message.trim()) return;  // Don't send empty messages
  
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      })
  
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
  
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
  }

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#f0f2f5"
    >
      <Paper
        elevation={3}
        sx={{
          width: { xs: '90%', sm: '500px' },
          height: { xs: '90%', sm: '700px' },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ece9e6 0%, #ffffff 100%)',
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Box
          bgcolor="primary.main"
          color="white"
          p={2}
          textAlign="center"
          sx={{
            background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            The All Things Athletic Chatbot
          </Typography>
        </Box>
        <Stack
          direction={'column'}
          p={2}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          sx={{
            background: '#f9f9f9',
            padding: '20px',
            borderRadius: '20px',
            boxShadow: 'inset 0px 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                sx={{
                  bgcolor:
                    message.role === 'assistant'
                      ? 'primary.light'
                      : 'secondary.light',
                  color: 'black',
                  borderRadius: 2,
                  p: 2,
                  maxWidth: '70%',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -10,
                    left: message.role === 'assistant' ? 15 : 'auto',
                    right: message.role === 'user' ? 15 : 'auto',
                    width: 0,
                    height: 0,
                    border: '10px solid transparent',
                    borderTopColor: message.role === 'assistant' ? 'primary.light' : 'secondary.light',
                  },
                }}
              >
                <Typography>{message.content}</Typography>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          p={2}
          borderTop="1px solid #e0e0e0"
          sx={{
            background: 'white',
            padding: '16px',
            borderRadius: '0 0 20px 20px',
            boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Stack direction={'row'} spacing={2}>
            <TextField
              label="Type your message..."
              fullWidth
              variant="outlined"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              sx={{
                borderRadius: '20px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5b0dbb 0%, #1f60d4 100%)',
                },
              }}
            >
              Send
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}

