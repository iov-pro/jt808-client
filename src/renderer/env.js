const ENV_DEV = {
    BASE_PATH: 'https://localhost:8080/'
};

const ENV_PRO = {
    BASE_PATH: 'https://service.nothingjs.com/'
};

let ENV_EXP = undefined;

if (process.env.NODE_ENV === 'development') {
    ENV_EXP = ENV_DEV
} else {
    ENV_EXP = ENV_PRO
}

export default ENV_EXP