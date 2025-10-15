
        // API Configuration
        const API_BASE_URL = 'http://localhost:3000/api'; // Change this to your backend URL
        
        // DOM Elements
        const welcomeScreen = document.getElementById('welcome-screen');
        const userInfoForm = document.getElementById('user-info-form');
        const userNameInput = document.getElementById('user-name');
        const userAgeInput = document.getElementById('user-age');
        const userGenderSelect = document.getElementById('user-gender');
        const userSpecialtySelect = document.getElementById('user-specialty');
        const startChatBtn = document.getElementById('start-chat-btn');
        const messagesContainer = document.getElementById('messages-container');
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const voiceInputBtn = document.getElementById('voice-input-btn');
        const startVoiceBtn = document.getElementById('start-voice-btn');
        const stopVoiceBtn = document.getElementById('stop-voice-btn');
        const toggleSpeechBtn = document.getElementById('toggle-speech-btn');
        const voiceVisualizer = document.getElementById('voice-visualizer');
        const voiceRecordingIndicator = document.getElementById('voice-recording-indicator');
        const statusText = document.getElementById('status-text');
        const statusDot = document.getElementById('status-dot');
        const typingIndicator = document.getElementById('typing-indicator');
        const specialtyIndicator = document.getElementById('specialty-indicator');
        const modelSelect = document.getElementById('model-select');
        const mobileModelSelect = document.getElementById('mobile-model-select');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const newChatBtn = document.getElementById('new-chat-btn');
        const conversationHistory = document.getElementById('conversation-history');
        
        // Medical tool buttons
        const symptomCheckerBtn = document.getElementById('symptom-checker-btn');
        const healthTrackerBtn = document.getElementById('health-tracker-btn');
        const diagnosticAssistantBtn = document.getElementById('diagnostic-assistant-btn');
        const preventiveCareBtn = document.getElementById('preventive-care-btn');
        const medicationBtn = document.getElementById('medication-btn');
        
        // User information
        let currentUser = null;
        let currentSessionId = null;
        let isChatStarted = false;
        
        // Voice settings
        let isSpeechEnabled = true;
        let isVoiceActive = false;
        let voiceBars = [];
        
        // Mobile sidebar state
        let isSidebarOpen = false;
        
        // Conversation history
        let conversationHistoryData = [];
        
        // Initialize voice visualization bars
        function initializeVoiceVisualizer() {
            voiceBars = Array.from(voiceVisualizer.querySelectorAll('.voice-bar'));
        }
        
        // Update voice visualization
        function updateVoiceVisualization(volume) {
            if (!isVoiceActive) return;
            
            voiceBars.forEach((bar, index) => {
                const shouldBeActive = index < Math.floor(volume / 10);
                if (shouldBeActive) {
                    bar.classList.add('active');
                    bar.style.height = `${10 + (index * 5)}px`;
                } else {
                    bar.classList.remove('active');
                    bar.style.height = '4px';
                }
            });
        }
        
        // Auto-resize textarea
        userInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        // Mobile sidebar toggle
        function toggleSidebar() {
            isSidebarOpen = !isSidebarOpen;
            sidebar.classList.toggle('open', isSidebarOpen);
            sidebarOverlay.classList.toggle('active', isSidebarOpen);
            
            // Update menu icon
            const menuIcon = mobileMenuBtn.querySelector('i');
            if (isSidebarOpen) {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            } else {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        }
        
        mobileMenuBtn.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);
        
        // Close sidebar when clicking on a history item (mobile)
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    toggleSidebar();
                }
            });
        });
        
        // Speech Recognition Setup
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let recognition;
        let isListening = false;
        
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onstart = function() {
                statusText.textContent = "Listening... Please describe your symptoms";
                voiceInputBtn.style.color = "#ef4444";
                startVoiceBtn.classList.add('active');
                stopVoiceBtn.disabled = false;
                isListening = true;
                isVoiceActive = true;
                voiceVisualizer.style.display = 'flex';
                voiceRecordingIndicator.style.display = 'block';
            };
            
            recognition.onresult = function(event) {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                
                userInput.value = transcript;
                userInput.dispatchEvent(new Event('input'));
                
                // Simulate voice visualization based on transcript length
                const volume = Math.min(100, transcript.length * 2);
                updateVoiceVisualization(volume);
            };
            
            recognition.onerror = function(event) {
                console.error("Speech recognition error:", event.error);
                statusText.textContent = "Error: " + event.error;
                voiceInputBtn.style.color = "";
                startVoiceBtn.classList.remove('active');
                stopVoiceBtn.disabled = true;
                isListening = false;
                isVoiceActive = false;
                voiceVisualizer.style.display = 'none';
                voiceRecordingIndicator.style.display = 'none';
            };
            
            recognition.onend = function() {
                if (isListening) {
                    statusText.textContent = "Processing your symptoms...";
                    voiceInputBtn.style.color = "";
                    startVoiceBtn.classList.remove('active');
                    stopVoiceBtn.disabled = true;
                    isListening = false;
                    isVoiceActive = false;
                    voiceVisualizer.style.display = 'none';
                    voiceRecordingIndicator.style.display = 'none';
                    
                    // Auto-send if there's text
                    if (userInput.value.trim()) {
                        setTimeout(() => {
                            sendMessage();
                        }, 500);
                    }
                }
            };
        } else {
            voiceInputBtn.disabled = true;
            startVoiceBtn.disabled = true;
            voiceInputBtn.title = "Speech Recognition not supported in your browser";
            startVoiceBtn.title = "Speech Recognition not supported in your browser";
        }
        
        // Event Listeners
        startChatBtn.addEventListener('click', startChat);
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        voiceInputBtn.addEventListener('click', toggleVoiceRecognition);
        startVoiceBtn.addEventListener('click', startVoiceRecognition);
        stopVoiceBtn.addEventListener('click', stopVoiceRecognition);
        toggleSpeechBtn.addEventListener('click', toggleSpeech);
        newChatBtn.addEventListener('click', startNewChat);
        
        // Sync specialty selectors
        modelSelect.addEventListener('change', function() {
            mobileModelSelect.value = this.value;
            updateSpecialty();
        });
        
        mobileModelSelect.addEventListener('change', function() {
            modelSelect.value = this.value;
            updateSpecialty();
        });
        
        // Medical tool button event listeners
        symptomCheckerBtn.addEventListener('click', function() {
            if (!isChatStarted) {
                alert("Please complete the setup first.");
                return;
            }
            addMessage("I'd like to use the symptom checker. What symptoms should I describe?", true);
            setTimeout(() => {
                addMessage("Of course. Please describe all your symptoms in detail, including when they started, their severity, and any factors that make them better or worse.", false);
                if (isSpeechEnabled) {
                    speakResponse("Of course. Please describe all your symptoms in detail, including when they started, their severity, and any factors that make them better or worse.");
                }
            }, 500);
        });
        
        healthTrackerBtn.addEventListener('click', function() {
            if (!isChatStarted) {
                alert("Please complete the setup first.");
                return;
            }
            addMessage("I want to track my health data.", true);
            setTimeout(() => {
                addMessage("Excellent. I can help you track various health metrics. Please share your current vitals like blood pressure, heart rate, weight, or any medications you're taking. You can also ask me to set reminders for medications or appointments.", false);
                if (isSpeechEnabled) {
                    speakResponse("Excellent. I can help you track various health metrics. Please share your current vitals like blood pressure, heart rate, weight, or any medications you're taking.");
                }
            }, 500);
        });
        
        diagnosticAssistantBtn.addEventListener('click', function() {
            if (!isChatStarted) {
                alert("Please complete the setup first.");
                return;
            }
            addMessage("I need help interpreting diagnostic results.", true);
            setTimeout(() => {
                addMessage("I can assist with understanding lab results or diagnostic reports. Please share the details of your test results, and I'll help explain what they might indicate. Remember, I can provide information but not medical diagnoses.", false);
                if (isSpeechEnabled) {
                    speakResponse("I can assist with understanding lab results or diagnostic reports. Please share the details of your test results, and I'll help explain what they might indicate.");
                }
            }, 500);
        });
        
        preventiveCareBtn.addEventListener('click', function() {
            if (!isChatStarted) {
                alert("Please complete the setup first.");
                return;
            }
            addMessage("I'd like preventive health advice.", true);
            setTimeout(() => {
                addMessage("Preventive care is essential for long-term health. Tell me about your lifestyle - diet, exercise, sleep patterns, stress levels, and any family medical history. I'll provide personalized recommendations for maintaining your health.", false);
                if (isSpeechEnabled) {
                    speakResponse("Preventive care is essential for long-term health. Tell me about your lifestyle - diet, exercise, sleep patterns, stress levels, and any family medical history.");
                }
            }, 500);
        });
        
        medicationBtn.addEventListener('click', function() {
            if (!isChatStarted) {
                alert("Please complete the setup first.");
                return;
            }
            addMessage("I have questions about medications.", true);
            setTimeout(() => {
                addMessage("I can provide information about medications, their uses, side effects, and interactions. Please tell me which medication you're asking about or describe your medication concerns. Remember to always consult with a healthcare provider before making any changes to your medications.", false);
                if (isSpeechEnabled) {
                    speakResponse("I can provide information about medications, their uses, side effects, and interactions. Please tell me which medication you're asking about or describe your medication concerns.");
                }
            }, 500);
        });
        
        // Functions
        function startChat() {
            const userName = userNameInput.value.trim();
            const userAge = userAgeInput.value.trim();
            const userGender = userGenderSelect.value;
            const userSpecialty = userSpecialtySelect.value;
            
            if (!userName) {
                alert("Please enter your name to begin.");
                return;
            }
            
            if (!userAge) {
                alert("Please enter your age for personalized medical advice.");
                return;
            }
            
            if (!userGender) {
                alert("Please select your gender for appropriate medical guidance.");
                return;
            }
            
            // Set the specialty based on user selection
            modelSelect.value = userSpecialty;
            mobileModelSelect.value = userSpecialty;
            
            try {
                // Create user in database (simulated)
                currentUser = {
                    id: 1,
                    name: userName,
                    age: parseInt(userAge),
                    gender: userGender
                };
                
                // Create a new session (simulated)
                currentSessionId = Date.now();
                
                // Hide welcome screen
                welcomeScreen.style.display = 'none';
                isChatStarted = true;
                
                // Set up the system message
                const systemMessage = createSystemMessage();
                conversationHistoryData = [systemMessage];
                
                // Add initial greeting from Dr. GenZ
                addMessage(getInitialGreeting(), false);
                
                // Speak the greeting if speech is enabled
                if (isSpeechEnabled) {
                    speakResponse(getInitialGreeting());
                }
                
                statusText.textContent = `Consulting with ${userName}`;
                
                // Update specialty indicator
                updateSpecialty();
                
            } catch (error) {
                console.error('Failed to start chat:', error);
                alert('Failed to initialize chat. Please try again.');
            }
        }
        
        function updateSpecialty() {
            const specialty = modelSelect.value;
            let specialtyText = '';
            
            switch(specialty) {
                case 'general':
                    specialtyText = 'General Medicine';
                    break;
                case 'pediatrics':
                    specialtyText = 'Pediatrics';
                    break;
                case 'cardiology':
                    specialtyText = 'Cardiology';
                    break;
                case 'dermatology':
                    specialtyText = 'Dermatology';
                    break;
                case 'mental':
                    specialtyText = 'Mental Health';
                    break;
            }
            
            specialtyIndicator.textContent = specialtyText;
            
            if (isChatStarted) {
                conversationHistoryData[0] = createSystemMessage();
                addMessage(`I've switched to ${specialtyText} mode. How can I assist you with your health concerns?`, false);
                
                if (isSpeechEnabled) {
                    speakResponse(`I've switched to ${specialtyText} mode. How can I assist you with your health concerns?`);
                }
            }
        }
        
        function createSystemMessage() {
            const specialty = modelSelect.value;
            let specialtyFocus = '';
            
            switch(specialty) {
                case 'general':
                    specialtyFocus = 'You are a general practitioner with broad medical knowledge.';
                    break;
                case 'pediatrics':
                    specialtyFocus = 'You specialize in pediatric care and children\'s health.';
                    break;
                case 'cardiology':
                    specialtyFocus = 'You specialize in heart health and cardiovascular conditions.';
                    break;
                case 'dermatology':
                    specialtyFocus = 'You specialize in skin conditions and dermatological health.';
                    break;
                case 'mental':
                    specialtyFocus = 'You specialize in mental health and psychological well-being.';
                    break;
            }
            
            return {
                role: "system",
                content: `You are Dr. GenZ, an AI medical assistant designed to provide health information and guidance.
                The user is ${currentUser.name}, ${currentUser.age} years old, who identifies as ${currentUser.gender}.
                
                ${specialtyFocus}
                
                IMPORTANT MEDICAL DISCLAIMER: You are an AI assistant, not a licensed medical professional. 
                You cannot provide medical diagnoses, prescribe treatments, or replace professional medical care.
                
                Your role is to:
                - Provide general health information and education
                - Help users understand their symptoms
                - Explain medical terms and conditions
                - Offer lifestyle and wellness advice
                - Guide users on when to seek professional medical care
                
                Always include appropriate medical disclaimers in your responses.
                If symptoms suggest a serious condition, advise immediate medical attention.
                Be empathetic, clear, and professional in your communication.
                Ask follow-up questions to gather relevant health information.
                Provide evidence-based information when possible.
                Respect user privacy and maintain confidentiality.
                
                Current conversation context: ${currentUser.name} is seeking medical information and guidance.`
            };
        }
        
        function getInitialGreeting() {
            const age = parseInt(currentUser.age);
            let ageGroup = '';
            
            if (age < 18) ageGroup = 'young';
            else if (age < 40) ageGroup = 'adult';
            else if (age < 65) ageGroup = 'middle-aged';
            else ageGroup = 'senior';
            
            const greetings = [
                `Hello ${currentUser.name}, I'm Dr. GenZ. I understand you're ${currentUser.age} years old. I'm here to provide health information and guidance. Please remember that I'm an AI assistant, not a replacement for professional medical care. How can I help you today?`,
                `Welcome ${currentUser.name}. I'm Dr. GenZ, your AI medical assistant. I see you're ${currentUser.age} years old. I can help answer health questions and provide general medical information. What would you like to discuss?`,
                `Good day ${currentUser.name}. I'm Dr. GenZ. As a ${ageGroup} individual aged ${currentUser.age}, you may have specific health considerations. I'm here to provide information and guidance. What health concerns would you like to address?`
            ];
            
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
        
        function toggleVoiceRecognition() {
            if (!SpeechRecognition) {
                statusText.textContent = "Speech recognition not supported in your browser";
                return;
            }
            
            if (isListening) {
                recognition.stop();
            } else {
                userInput.value = '';
                userInput.dispatchEvent(new Event('input'));
                recognition.start();
            }
        }
        
        function startVoiceRecognition() {
            if (!SpeechRecognition) {
                statusText.textContent = "Speech recognition not supported in your browser";
                return;
            }
            
            userInput.value = '';
            userInput.dispatchEvent(new Event('input'));
            recognition.start();
        }
        
        function stopVoiceRecognition() {
            if (isListening) {
                recognition.stop();
            }
        }
        
        function toggleSpeech() {
            isSpeechEnabled = !isSpeechEnabled;
            toggleSpeechBtn.querySelector('.voice-btn-text').textContent = 
                `Voice: ${isSpeechEnabled ? 'ON' : 'OFF'}`;
            toggleSpeechBtn.style.backgroundColor = isSpeechEnabled ? '' : 'var(--text-muted)';
            
            // Update icon
            const icon = toggleSpeechBtn.querySelector('i');
            if (isSpeechEnabled) {
                icon.classList.remove('fa-volume-mute');
                icon.classList.add('fa-volume-up');
            } else {
                icon.classList.remove('fa-volume-up');
                icon.classList.add('fa-volume-mute');
            }
        }
        
        function addMessage(message, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
            
            if (isUser) {
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <div class="message-sender">${currentUser.name}</div>
                        <div>${message}</div>
                    </div>
                    <div class="message-avatar user-avatar">${currentUser.name.charAt(0)}</div>
                `;
            } else {
                // Check if message contains medical alerts
                let formattedMessage = message;
                if (message.includes('EMERGENCY') || message.includes('urgent') || message.includes('immediately')) {
                    formattedMessage = `<div class="medical-alert">${message}</div>`;
                } else if (message.includes('warning') || message.includes('caution')) {
                    formattedMessage = `<div class="medical-warning">${message}</div>`;
                } else if (message.includes('advice') || message.includes('recommend')) {
                    formattedMessage = `<div class="medical-advice">${message}</div>`;
                }
                
                messageDiv.innerHTML = `
                    <div class="message-avatar bot-avatar">D</div>
                    <div class="message-content">
                        <div class="message-sender">Dr. GenZ</div>
                        <div>${formattedMessage}</div>
                    </div>
                `;
            }
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function showTypingIndicator() {
            typingIndicator.style.display = 'flex';
            statusDot.classList.add('thinking');
        }
        
        function hideTypingIndicator() {
            typingIndicator.style.display = 'none';
            statusDot.classList.remove('thinking');
        }
        
        async function sendMessage() {
            if (!isChatStarted) {
                alert("Please complete the setup first.");
                return;
            }
            
            const message = userInput.value.trim();
            if (!message) return;
            
            // Check for emergency keywords
            const emergencyKeywords = ['heart attack', 'stroke', 'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'suicidal'];
            const hasEmergency = emergencyKeywords.some(keyword => 
                message.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (hasEmergency) {
                addMessage(`⚠️ MEDICAL EMERGENCY DETECTED: Based on your message, this may be a serious medical emergency. Please call your local emergency services (like 911) immediately or go to the nearest emergency room. Do not wait for a response from me.`, false);
                if (isSpeechEnabled) {
                    speakResponse("MEDICAL EMERGENCY DETECTED. Please call your local emergency services immediately or go to the nearest emergency room. Do not wait for a response from me.");
                }
            }
            
            // Add user message to chat
            addMessage(message, true);
            userInput.value = '';
            userInput.style.height = 'auto';
            
            // Add to conversation history
            conversationHistoryData.push({
                role: "user",
                content: message
            });
            
            // Show typing indicator
            showTypingIndicator();
            statusText.textContent = "Dr. GenZ is analyzing your symptoms...";
            sendBtn.disabled = true;
            
            try {
                // Update system message with current specialty
                conversationHistoryData[0] = createSystemMessage();
                
                // Call Groq API
                const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
                const API_KEY = "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";
                
                const response = await fetch(GROQ_API_URL, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        messages: conversationHistoryData,
                        model: "llama-3.1-8b-instant",
                        temperature: 0.7,
                        max_tokens: 1024,
                        stream: false
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API error: ${response.status} - ${errorText}`);
                }
                
                const data = await response.json();
                
                // Extract the generated text from the response
                let botResponse = "I'm having trouble processing your request right now. Could you please rephrase your question?";
                if (data && data.choices && data.choices[0] && data.choices[0].message) {
                    botResponse = data.choices[0].message.content;
                    
                    // Add to conversation history
                    conversationHistoryData.push({
                        role: "assistant",
                        content: botResponse
                    });
                    
                    // Limit conversation history to prevent token overflow
                    if (conversationHistoryData.length > 12) {
                        conversationHistoryData = [
                            conversationHistoryData[0], // Keep system message
                            ...conversationHistoryData.slice(-10) // Keep last 10 exchanges
                        ];
                    }
                }
                
                // Add bot response to chat
                addMessage(botResponse);
                
                // Speak the response if enabled
                if (isSpeechEnabled) {
                    speakResponse(botResponse);
                } else {
                    statusText.textContent = "Waiting for your response";
                    hideTypingIndicator();
                    sendBtn.disabled = false;
                }
                
            } catch (error) {
                console.error("Error:", error);
                hideTypingIndicator();
                
                // Fallback response if API fails
                const fallbackResponses = [
                    "I'm experiencing technical difficulties right now. Please try again in a moment.",
                    "There seems to be a connection issue. Let's try that again.",
                    "I apologize, but I'm having trouble processing your request. Could you please rephrase your question?"
                ];
                
                const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
                addMessage(randomResponse);
                statusText.textContent = "Connection issue - please try again";
                sendBtn.disabled = false;
            }
        }
        
        function speakResponse(text) {
            if ('speechSynthesis' in window) {
                // Stop any ongoing speech
                window.speechSynthesis.cancel();
                
                // Clean the text for speech (remove markdown, etc.)
                const cleanText = text.replace(/[#*\[\]_`]/g, '');
                
                const utterance = new SpeechSynthesisUtterance(cleanText);
                
                // Medical professional voice settings
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                utterance.volume = 0.8;
                
                utterance.onstart = function() {
                    statusText.textContent = "Dr. GenZ is speaking...";
                };
                
                utterance.onend = function() {
                    statusText.textContent = "Waiting for your response";
                    statusDot.classList.remove('thinking');
                    voiceInputBtn.style.color = "";
                    isListening = false;
                    userInput.focus();
                    hideTypingIndicator();
                    sendBtn.disabled = false;
                };
                
                utterance.onerror = function(event) {
                    console.error("Speech synthesis error:", event);
                    statusText.textContent = "Voice issue, but I've processed your request";
                    hideTypingIndicator();
                    sendBtn.disabled = false;
                };
                
                window.speechSynthesis.speak(utterance);
            } else {
                // If speech synthesis is not available, just reset the UI
                statusText.textContent = "Waiting for your response";
                statusDot.classList.remove('thinking');
                userInput.focus();
                hideTypingIndicator();
                sendBtn.disabled = false;
            }
        }
        
        // Initialize the voice visualizer
        initializeVoiceVisualizer();
        
        // Handle window resize
        window.addEventListener('resize', function() {
            // Close sidebar on resize to desktop if open
            if (window.innerWidth > 768 && isSidebarOpen) {
                toggleSidebar();
            }
        });
