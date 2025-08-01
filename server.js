const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const config = {
    user: 'ARKDS',
    password: 'Mk123456',
    server: 'mssql-200394-0.cloudclusters.net',
    port: 19623,
    database: 'DinoBook',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// Tạo pool kết nối dùng lại, tránh connect lại nhiều lần
let pool;
async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

app.post('/api/login', async (req, res) => {
    const { loginEmail, loginPassword } = req.body;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('loginEmail', sql.NVarChar, loginEmail)
            .input('loginPassword', sql.NVarChar, loginPassword)
            .query(`
                SELECT TOP 1 * FROM [DinoBook].[dbo].[TaiKhoan]
                WHERE TenDangNhap = @loginEmail
                AND MatKhau = @loginPassword
            `);
        if (result.recordset.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
        }
    } catch (err) {
        console.error('Lỗi server:', err); // Log chi tiết lên Render
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('API đang chạy!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('API server running on port ' + port);
});