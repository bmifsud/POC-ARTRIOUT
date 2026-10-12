#include <emscripten.h>
#include <iostream>

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void createARRendererModule() {
        std::cout << "AR Renderer Module initialized" << std::endl;
    }
}
