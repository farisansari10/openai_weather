import React, {useState} from 'react'
import axios from 'axios'

function Weather() {
    const [query, setQuery] = useState("");

    async function fetch_weather(city) {
        console.log(`Fetching weather for ${city}`);
        const weatherAPIKey = import.meta.env.VITE_WEATHER_API_KEY;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherAPIKey}`;

        try {
            const response = await axios.get(weatherUrl);
            const temperatureInCelsius = response.data.main.temp - 273.15;
            return JSON.stringify({
                success: true,
                message: `The temperature in ${city} is ${temperatureInCelsius.toFixed(
                    2
                )}C.`,
            });
        }catch (error) {
            console.log(error);
        }
    }

    async function run_conversation(query) {
        const baseURL = "https://api.openai.com/v1/chat/completions";
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        };

        let data ={
            model: "gpt-3.5-turbo-0613",
            messages: [
                {
                    role: "user",
                    content: query
                },
            ],
            functions: [
                {
                    name: "fetch_weather",
                    description: "Please fetch weather for a city",
                    parameters: {
                        city: {
                            type: "String",
                            description: "City to fetch weather for"
                        },
                    },
                    required: ["city"],
                }
            ]
        }
        try{
            console.log("Sending request to OpenAI...");
            let response = await axios.post(baseURL,data, {headers: headers});
            response = response.data;

            let message = response.choices[0].message;
            const function_name = message.function_call.name;

            if(function_name === "fetch_weather"){
                let functionArgs = JSON.parse(message.function_call.arguments);
                let function_response = await fetch_weather(functionArgs.city);

                const isGoodWeather = function_response.includes("sunny");
            const coffeeResponse = isGoodWeather
                ? "It's a good day for coffee outside! ☀️"
                : "It's rainy, not the best weather for coffee outside. ☔";


                data.messages.push({
                    role: "functions",
                    name: function_name,
                    content: function_response,
                });

                data.messages.push({
                    role: "assistant",
                    content: coffeeResponse 
                });

                console.log("Sending request to OpenAI API...");
                response = await axios.post(baseURL,data, {headers: headers});
                response = response.data;
            }
            console.log(response.choices[0].message.content);
        }catch(error) {
            console.log(error);
        }
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        run_conversation(query);
        setQuery("");
    }
  return ( 
    <div>
        <form onSubmit={handleSubmit}>
            <label>
                Enter your question:
                <input 
                    type='text'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </label>
            <input type='submit' value="Ask" />
        </form>
    </div>
  )
}

export default Weather