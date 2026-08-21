const videoPlayer = document.querySelector('#videoPlayer');
const fileInput = document.querySelector('#fileInput');
const mp4Url = document.querySelector('#mp4Url');
const loadUrlButton = document.querySelector('#loadUrlButton');
const emptyState = document.querySelector('#emptyState');
const fileStatus = document.querySelector('#fileStatus');
const converterForm = document.querySelector('#converterForm');
const youtubeUrl = document.querySelector('#youtubeUrl');
const conversionStatus = document.querySelector('#conversionStatus');
const downloadLink = document.querySelector('#downloadLink');

function playMp4(source, label) {
	videoPlayer.src = source;
	videoPlayer.load();
	emptyState.hidden = true;
	fileStatus.textContent = label;
}

fileInput.addEventListener('change', () => {
	const [file] = fileInput.files;
	if (!file) return;
	playMp4(URL.createObjectURL(file), file.name);
});

loadUrlButton.addEventListener('click', () => {
	const url = mp4Url.value.trim();
	if (!url || !url.toLowerCase().split('?')[0].endsWith('.mp4')) {
		fileStatus.textContent = 'ต้องเป็น URL ของ MP4';
		return;
	}
	playMp4(url, 'วิดีโอจาก URL');
});

converterForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	const url = youtubeUrl.value.trim();
	if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url)) {
		conversionStatus.textContent = 'กรุณาใส่ลิงก์ YouTube ที่ถูกต้อง';
		return;
	}

	conversionStatus.textContent = 'กำลังส่งลิงก์ไปยังตัวแปลง...';
	downloadLink.hidden = true;
	const submitButton = converterForm.querySelector('button[type="submit"]');
	submitButton.disabled = true;
	try {
		const response = await fetch('/api/youtube-to-mp4', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url })
		});
		const result = await response.json().catch(() => ({}));
		if (!response.ok) throw new Error(result.error || `เซิร์ฟเวอร์ตอบกลับ ${response.status}`);
		if (!result.mp4Url) throw new Error('missing_file');
		playMp4(result.mp4Url, 'วิดีโอที่แปลงแล้ว');
		downloadLink.href = result.mp4Url;
		downloadLink.hidden = false;
		conversionStatus.textContent = 'แปลงสำเร็จ';
	} catch (error) {
		conversionStatus.textContent = `แปลงไม่สำเร็จ: ${error.message}`;
	} finally {
		submitButton.disabled = false;
	}
});
