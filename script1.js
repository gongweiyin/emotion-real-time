// https://github.com/justadudewhohacks/face-api.js 主要含有人脸识别，特征提取，年龄和性别检测，以及表情识别。
//https://gitee.com/TsMask/face-api-demo-vue#https://gitee.com/link?target=https%3A%2F%2Fenv-00jxgaqjulpu-static.normal.cloudstatic.cn%2Fface-api-demo-vue%2Findex.html%23%2F  npm

const video = document.getElementById('video')
const startButton = document.getElementById('startButton')
const stopButton = document.getElementById('stopButton')
const emotionsContainer = document.getElementById('emotionsContainer')
const speechDisplayArea = document.getElementById('speechDisplayArea')
let stream = null // Store video stream
let intervalId = null // Store interval ID for face detection
let recognition = null // Store speech recognition instance
let currentSpeechText = "" // Store current recognized speech

// Define emotions with Chinese translations
const emotionLabels = { 
    'neutral': '中性',
    'happy': '开心',
    'sad': '悲伤',
    'angry': '生气',
    'fearful': '害怕',
    'disgusted': '厌恶',
    'surprised': '惊讶'
}

// Define emotion thresholds for bubble display
const emotionThresholds = {
    'neutral': 0.7,
    'happy': 0.5,
    'sad': 0.5,
    'angry': 0.5,
    'fearful': 0.5,
    'disgusted': 0.5,
    'surprised': 0.5
}

// Define emotion icons/emojis for bubbles
const emotionIcons = {
    'neutral': '😐',
    'happy': '😊',
    'sad': '😢',
    'angry': '😠',
    'fearful': '😨',
    'disgusted': '🤢',
    'surprised': '😲'
}
// Function to update emotions display 用于更新显示用户情绪的可视化信息
function updateEmotionsDisplay(expressions) {
    emotionsContainer.innerHTML = ''; // 清空容器,确保每次只显示最新的情绪信息
    
    // Sort emotions by probability
    const sortedEmotions = Object.entries(expressions) // 将表情对象转换为数组
        .sort((a, b) => b[1] - a[1]); // 根据概率对表情进行排序,确保最大概率的表情排在最前面

    sortedEmotions.forEach(([emotion, probability]) => {
    
        const emotionBar = document.createElement('div');

        emotionsContainer.appendChild(emotionBar);
        
        // Check if this emotion exceeds threshold to show bubble
        if (probability > emotionThresholds[emotion]) {
            showEmotionBubble(emotion, probability);
        }
    });
}

// Function to create and display emotion bubble
function showEmotionBubble(emotion, probability) {
    const bubble = document.createElement('div');
    bubble.className = 'emotion-bubble';
    const chineseLabel = emotionLabels[emotion] || emotion;
    const percentage = (probability * 100).toFixed(1);
    const icon = emotionIcons[emotion] || '😐';
    
    bubble.innerHTML = `
        <span class="emotion-icon">${icon}</span>
        <span class="emotion-text">${chineseLabel}: ${percentage}%</span>
    `;
    
    // Apply bubble styling
    bubble.style.position = 'absolute';
    bubble.style.top = `${Math.random() * 50 + 10}%`;
    bubble.style.left = `${Math.random() * 70 + 10}%`;
    bubble.style.backgroundColor = getEmotionColor(emotion);
    bubble.style.color = 'white';
    bubble.style.padding = '10px 15px';
    bubble.style.borderRadius = '20px';
    bubble.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    bubble.style.zIndex = '100';
    bubble.style.animation = 'float 3s ease-in-out forwards';
    bubble.style.opacity = '0.9';
    bubble.style.fontSize = '16px';
    bubble.style.fontWeight = 'bold';
    
    // Add bubble to video container
    document.querySelector('.video-container').appendChild(bubble);
    
    // Remove bubble after animation
    setTimeout(() => {
        if (bubble.parentNode) {
            bubble.parentNode.removeChild(bubble);
        }
    }, 3000);
}

// Function to get color for each emotion
function getEmotionColor(emotion) {
    const colors = {
        'neutral': '#808080',
        'happy': '#FFD700',
        'sad': '#4169E1',
        'angry': '#FF0000',
        'fearful': '#800080',
        'disgusted': '#006400',
        'surprised': '#FFA500'
    };
    return colors[emotion] || '#4CAF50';
} //识别结果现实的颜色

// Load models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),//用于检测人脸的位置和大小
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),//用于人脸识别或特征提取
    faceapi.nets.ageGenderNet.loadFromUri('/models'),//用于人脸检测的年龄和性别
    faceapi.nets.faceExpressionNet.loadFromUri('/models')//用于识别面部表情(如开心、生气等)
]).then(() => {
    startButton.disabled = false;//所有模型加载完成后才能启动开始按钮
    speechDisplayArea.textContent = "模型加载完成，点击开启摄像头开始检测";
    
    // Add animation style for bubbles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% {
                transform: translateY(0) scale(0.5);
                opacity: 0;
            }
            20% {
                transform: translateY(-10px) scale(1);
                opacity: 0.9;
            }
            80% {
                transform: translateY(-30px) scale(1);
                opacity: 0.9;
            }
            100% {
                transform: translateY(-50px) scale(0.8);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});//Promise.all([])用于同时加载多个网络模型，确保它们都加载完成后才继续执行后续代码。

function startVideo() {
    navigator.mediaDevices.getUserMedia({ 
        video: {},
        audio: true
    })//navigator.mediaDevices.getUserMedia：这是一个 Web API 方法，用于请求访问用户的媒体设备（如摄像头和麦克风）。
    .then(mediaStream => {
        stream = mediaStream; //获取用户媒体成功后，将媒体流赋值给video元素的srcObject属性，并设置相关按钮的状态。
        video.srcObject = stream; //将媒体流赋值给video元素,视频开始播放
        startButton.disabled = true; //禁用开始按钮，启用停止按钮
        stopButton.disabled = false; //启用停止按钮，禁用开始按钮
        
        video.addEventListener('play', startDetection); //添加一个play事件监听器，当视频播放时，开始检测人脸
        
    })
    .catch(err => {
        console.error("Error accessing media devices:", err);
        alert("无法访问摄像头，请确保已授予必要权限。");
    });
}

function stopVideo() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    } //如果stream变量不为null，则停止媒体流并清除相关变量。
    
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    } //如果intervalId变量不为null，则清除定时器并清除相关变量。

    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.remove();
    } //如果页面上存在canvas元素，则删除该元素。

    // Remove any remaining emotion bubbles
    const bubbles = document.querySelectorAll('.emotion-bubble');
    bubbles.forEach(bubble => {
        if (bubble.parentNode) {
            bubble.parentNode.removeChild(bubble);
        }
    });

    // 保存最终的检测结果
    if (detectionResults.length > 0) {
        saveDetectionResults(detectionResults, true);
    }
    
    // Clear emotions display
    emotionsContainer.innerHTML = '';
    startButton.disabled = false;
    stopButton.disabled = true; //禁用停止按钮，启用开始按钮
}

// 存储表情、年龄、性别和语音的数组
let detectionResults = [];

// 实时保存所有结果（检测结果和语音结果）
function saveAllResults() {
    try {
        const allResults = {
            detectionResults: detectionResults
            // speechResults: speechResults
        };
        
        // 转换为 JSON 字符串
        const jsonResults = JSON.stringify(allResults, null, 2);
        
        // 将 JSON 保存到 localStorage
        localStorage.setItem('allResults', jsonResults);
        console.log(jsonResults);
        postData(jsonResults);
    } catch (error) {
        console.error('Error saving results:', error);
    }
}

function startDetection() {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.querySelector('.video-container').appendChild(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    intervalId = setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, 
            new faceapi.TinyFaceDetectorOptions())
            .withAgeAndGender()
            .withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        
        resizedDetections.forEach(detection => {
            const { age, gender, genderProbability, expressions } = detection;
            
            // 更新情绪显示
            updateEmotionsDisplay(expressions);
            
            // 存储检测结果
            const result = {
                timestamp: new Date().toISOString(), // 添加时间戳
                age: Math.round(age),
                gender: gender,
                genderProbability: Math.round(genderProbability * 100),
                expressions: expressions
            };
            
            detectionResults.push(result);
            
        });
    }, 500);
}


// 修改：保存检测结果为 JSON 文件
function saveDetectionResults(results, isFinal = false) {
    try {
        // 合并结果
        const allResults = {
            detectionResults: results
            // speechResults: speechResults
        };
        
        // 转换为 JSON 字符串
        const jsonResults = JSON.stringify(allResults, null, 2);
        
        // 将 JSON 保存到 localStorage
        localStorage.setItem('allResults', jsonResults);
        console.log('All Results Saved:', jsonResults);
        
        // 如果是最终结果，提供下载
        if (isFinal && (results.length > 0 || speechResults.length > 0)) {
            downloadJSON(jsonResults, 'detection_speech_results.json');
        }
    } catch (error) {
        console.error('Error saving detection results:', error);
    }
}

startButton.addEventListener('click', startVideo);
stopButton.addEventListener('click', stopVideo);