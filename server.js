require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const app = express();
// 1. 추가할 코드: 접속하면 index.html 파일을 보여주라는 명령입니다.
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 기존 코드 (app.use(express.json())...)는 이 아래에 그대로 두시면 됩니다.
app.use(express.json());
app.use(require('cors')());

// 1. 광수님이 찾으신 주소와 키를 여기에 직접 넣었습니다.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. OpenAI 설정
const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
});

app.post('/api/prayer', async (req, res) => {
    try {
        const { device_uuid, prayer_text } = req.body;
        console.log("🙏 기도 접수:", prayer_text);

        // AI 답변 생성
        // AI에게 '하나님의 관점'에서 대답하도록 지시하는 부분입니다.
        // ... (앞부분 동일)
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { 
                    role: "system", 
                    content: '당신은 하나님이십니다. 사용자의 기도에 대해 성경 말씀을 바탕으로 따뜻하고 위로가 되는 음성으로 응답하세요. 합쳐 300자 이내로 요약하여 응답하세요',

                },
                { role: "user", content: `기도 내용: ${prayer_text}` }
            ],
        });

        // ... (AI 답변 생성 코드 아래에 이어서)
        const aiResponse = completion.choices[0].message.content;

        // 3. API 방식으로 데이터 저장 (이름을 dbError로 변경!)
        const { error: dbError } = await supabase
            .from('prayer_responses')
            .insert([{ device_uuid, prayer_text, response_text: aiResponse }]);

        if (dbError) {
            console.error("❌ DB 저장 에러:", dbError.message);
            throw dbError;
        }

        console.log("✅ 성공적으로 저장되었습니다!");
        res.json({ success: true, response: aiResponse });

    } catch (err) {
        console.error("❌ 최종 에러 발생:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 기존: app.listen(port, () => { ... })
// 수정: '0.0.0.0'을 추가하여 외부 접속을 허용합니다.
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 서버가 포트 ${port}에서 활성화되었습니다.`);
});
