import SubIcon from './sub.svg';

const subIcon =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAlJJREFUeF7tm71LHFEUxX9bKVhECERQgpWY/AOpxCIIFlrEwkobIUIKIZAuhZgu3RISCwvFRiOICoIIwnYGBLUMpkglEoiViZVFinDCm8KV7MzuyDIfZ5tt3u7MOe++O/fec6ZCyT+VkuMnIqAbGAB6gAcFJ+UGuATOgQsRIPBjwAzwBOgrOAG/gW/AAbAiAqaA18Bj4GvBwQteJ9AfcFZFwDbwHNgAPpWAAB3xF8AroCYCasAj4B2wUwICBHEE+Aj8EAFnwB8T4AjwEXAOcBL0U8CPQdcBLoTKwYArQZfC7gXcDLkbdDvseYAHIp4IeSTmmaCHop4KeyxuXcDCiJUhS2PWBq0NWhu0Nmht0NqgtUFrg+VQxm6bpI6Ah8B7YLUkBIwDSzJMaiQm0BPAJrAYQ8CV7KUJSZIhMYvW246A9y2wJwJmgfkA6iQG3CHwIQEBAv8MmAR6E6xv5xIZJWUJ7lIUiABZZGWXlV/4f0Zp+Ym1bh2YjrnbCPwbYDQYk6/biTDmWjJLyy/8XdEfucUF/GmD3RoOfuI4AurBHwNbkqAyRIA2Q/fz7zvp+wKKkLWYCFCUDAEvw84LfBXYzRD4O7dyXwRElnu5zvXewRdgOevgxcZ9EFAPfj8kyriEmonASEtArsGnjYDcg09DQCHAt0rAXKgZooSXqzNfn3iazQEC+znUBMr2uQbfSgSoD/gZHnW5B98KAfrNryLsfHQUmj0ChQLfTASoUVoATkP7nIsiJ0mllTQC1AkOhjcus9TYJMHYcE1SAlJfKKt/UHoC/gKmoRp1hilnJgAAAABJRU5ErkJggg==';

export default (props) => {
    return (
        <button
            title="Add Subtitle"
            style={{
                height: '25px',
                width: '25px',
                backgroundImage: `url(${subIcon})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px 20px',
                backgroundPosition: 'center bottom',
            }}
            {...props}
        >
            +
        </button>
    );
};
