// Как работать с задачей:
// 1. Откройте сайт курса в браузере.
// 2. Найдите эту задачу на сайте.
// 3. Напишите код ниже вместо TODO.
// 4. Запустите этот файл локально в Visual Studio или другим C++17 компилятором.

// Упражнение. Old/Nouveau и virtual
// Тема: виртуальные методы.
//
// Что нужно сделать:
// 1. Создать class Old.
// 2. Добавить метод print().
// 3. Создать class Nouveau : public Old.
// 4. Добавить свою версию print() в Nouveau.
// 5. В main проверить:
//    - Old object;
//    - Nouveau object;
//    - Old* ptr = new Nouveau;
//    - ptr->print().
// 6. Сначала запустить без virtual у print().
// 7. Потом добавить virtual в Old и override в Nouveau.
// 8. Сравнить вывод.
//
// Важно:
// - если удаляете объект через Old*, у Old должен быть virtual destructor;
// - override помогает поймать ошибку в сигнатуре метода;
// - smart pointers в этой задаче пока не используем, они будут в следующей теме.
//
// Напишите решение ниже.
// Не смотрите в solutions до самостоятельной попытки.

#include <iostream>

using namespace std;

class Old {
public:
    // TODO: сначала напишите print() без virtual, затем добавьте virtual.
    void print() const;

    virtual ~Old() = default;
};

class Nouveau : public Old {
public:
    // TODO: сначала напишите print() без override, затем добавьте override.
    void print() const;
};

int main() {
    Old object;
    Nouveau nouveau;
    Old* ptr = new Nouveau;

    // TODO: вызовите print() у object
    // TODO: вызовите print() у nouveau
    // TODO: вызовите print() через ptr

    delete ptr;
    return 0;
}
